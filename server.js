// =========================================================================
// サーバー側 処理プログラム (server.js) - Web Push通知組み込み完全版
// =========================================================================

const webpush = require('web-push');

// GitHub Actionsから渡される環境変数を最優先で読み込み、コード上から実際の値を隠蔽します
const GAS_URL = process.env.GAS_URL || "";
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
//※コード上に直接書かれていた元の文字列は、先ほどGitHubの「Secrets」に登録したため、Actions側では自動的かつ安全に読み込まれます。
//（ローカル環境で再度テスト実行したい場合は、コマンドプロンプトやターミナルで GAS_URL="xxx" VAPID_PRIVATE_KEY="xxx" node server.js
//  のように環境変数を付与して起動するか、一時的に値を書き戻してテストする運用になります）

// Web Pushの設定（あなたの連絡先URLまたは mailto: メールアドレスを設定してください）
webpush.setVapidDetails(
    'mailto:ryuji.gohara@gmail.com', 
    VAPID_PUBLIC_KEY, 
    VAPID_PRIVATE_KEY
);

/**
 * メイン処理を制御するサブルーチン
 */
async function main() {
    try {
        console.log("--- 処理を開始します ---");
        
        // 1. スプレッドシート（GAS）から全ユーザーデータを取得
        const users = await fetchUserDataFromSpreadsheet(GAS_URL);
        console.log(`データ取得成功: 合計 ${users.length} 件のユーザーデータがあります。`);
        
        // 2. 各ユーザーの判定と個別処理の実行
        for (const user of users) {
            await processUserNotification(user);
        }
        
        console.log("\n--- 全ての処理が正常に終了しました ---");
    } catch (error) {
        console.error("\n[エラー] 処理中に問題が発生しました:", error.message);
    }
}

/**
 * 各ユーザーの時刻判定および通知準備を処理するサブルーチン
 * @param {Object} user - ユーザーデータ
 */
async function processUserNotification(user) {
    const userId = user.UserId || "(未設定)";
    const label = user.Label || "(未設定)";
    const lat = user.Lat || "(未設定)";
    const lon = user.Lon || "(未設定)";
    const lang = user.Lang || "ja";   // スプレッドシートに追加された言語設定（未設定時は'ja'）
    const unit = user.Unit || "ms";   // スプレッドシートに追加された単位設定（未設定時は'ms'）
    
    // ユーザーのタイムゾーンに基づいた「現在の現地時刻」を取得 (HH:mm)
    const localCurrentTime = getUserCurrentTime(user.TimeZone);
    
    // スプレッドシートの時刻表記（"7:00" など）を "07:00" 形式に整形して比較
    const targetTime = formatTimeStr(user.NotificationTime);
    
    console.log(`\n[ユーザー: ${userId} (${label}) (${lat}) (${lon})]`);
    console.log(`  設定時刻: ${targetTime} / 現在の現地時刻: ${localCurrentTime}`);
    
    // 時刻が一致しているか判定（5分おきの定期実行に対応するため、5分以内の時間枠に入っているか判定）
    if (isTimeInWindow(targetTime, localCurrentTime, 5)) {
        console.log("  -> ★通知対象の時間です。天気データを取得します。");
        
        if (!user.Lat || !user.Lon) {
            console.log("  [スキップ] 緯度または経度が設定されていません。");
            return;
        }
        
        try {
            // 3. Open-Meteoから時系列（hourly）気象データを取得
            const weatherData = await fetchWeatherData(user.Lat, user.Lon);
            
            // 4. 該当ユーザーの端末へ、気象データとユーザー設定をパッキングしてWeb Push通知を実際に送信する
            //（※テキスト生成処理はService Worker側へ完全移譲されたため、weatherDataをそのまま渡します）
            await sendWebPushNotification(user.Subscription, weatherData, userId, user.Lat, user.Lon, user.Label, lang, unit);
            
        } catch (err) {
            console.error(`  [エラー] 天気データ取得・生成中に失敗しました:`, err.message);
        }
    } else {
        console.log("  -> 時間外のため通知処理をスキップします。");
    }
}

/**
 * GASのウェブアプリAPIからユーザー設定データを取得するサブルーチン
 * @param {string} url - GASのウェブアプリURL
 * @returns {Promise<Array>} ユーザー設定データの配列
 */
async function fetchUserDataFromSpreadsheet(url) {
    if (!url || url.includes("ここにあなたのGAS")) {
        throw new Error("GAS_URL が設定されていません。コード内の GAS_URL に正しいURLを貼り付けてください。");
    }

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP通信エラー (ステータス: ${response.status})`);
    }

    return await response.json();
}

/**
 * 指定されたタイムゾーンにおける「現在の時刻」を HH:mm 形式の文字列で取得するサブルーチン
 * @param {string} timeZone - タイムゾーン文字列 (例: "Asia/Tokyo", "America/New_York")
 * @returns {string} HH:mm 形式の時刻文字列
 */
function getUserCurrentTime(timeZone) {
    // タイムゾーンが未設定、または空文字の場合はデフォルトで 'UTC' として処理します
    const tz = timeZone && timeZone.trim() !== "" ? timeZone : "UTC";
    
    try {
        const options = {
            timeZone: tz,
            hour: "2-digit",
            minute: "2-digit",
            hour12: false // 24時間表記（07:00 や 23:15 など）に固定します
        };
        
        // 言語設定を 'en-US' に指定することで、余計な日本語（"午前"など）の混入を防ぎ、純粋な数字のみを取得します
        const formatter = new Intl.DateTimeFormat("en-US", options);
        return formatter.format(new Date());
    } catch (error) {
        // 万が一スプレッドシートに不正なタイムゾーン名が入っていた場合の防衛策
        console.warn(`[警告] 不正なタイムゾーンが指定されたため UTC で代替します: "${timeZone}"`);
        return getUserCurrentTime("UTC");
    }
}

/**
 * スプレッドシートからの時刻文字列（例 "7:00", "07:00"）を "07:00" の2桁形式に統一するサブルーチン
 * @param {string} timeStr - 整形前の時刻文字列
 * @returns {string} HH:mm 形式の文字列
 */
function formatTimeStr(timeStr) {
    if (!timeStr || typeof timeStr !== "string" || !timeStr.includes(":")) {
        return "";
    }
    const [hour, minute] = timeStr.split(":");
    const paddedHour = hour.trim().padStart(2, "0");
    const paddedMinute = minute.trim().padStart(2, "0");
    return `${paddedHour}:${paddedMinute}`;
}

/**
 * Open-Meteo APIから時系列（hourly）気象データを取得するサブルーチン
 * @param {number|string} lat - 緯度
 * @param {number|string} lon - 経度
 * @returns {Promise<Object>} 気象データのJSONオブジェクト
 */
async function fetchWeatherData(lat, lon) {
    // スマホ側の3時間おきサマリー生成に必要な hourly パラメータを追加し、&forecast_days=2 で確実に48時間分のデータに制限します
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=weather_code,precipitation,wind_speed_10m,wind_direction_10m&wind_speed_unit=ms&forecast_days=2&timezone=auto`;
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Open-Meteo API 通信エラー (ステータス: ${response.status})`);
    }
    return await response.json();
}

/**
 * 該当ユーザーの端末へWeb Push通知を送信するサブルーチン
 * @param {string} subscriptionStr - スプレッドシートから取得したSubscriptionのJSON文字列
 * @param {Object} weatherData - Open-Meteoから取得した時系列気象データオブジェクト
 * @param {string} userId - ユーザーID（ログ出力用）
 * @param {string} lat - 緯度
 * @param {string} lon - 経度
 * @param {string} place - 地点名（ラベル）
 * @param {string} lang - 言語設定 ('ja' / 'en')
 * @param {string} unit - 風速単位設定 ('ms' / 'kn')
 */
async function sendWebPushNotification(subscriptionStr, weatherData, userId, lat, lon, place, lang, unit) {
    if (!subscriptionStr || subscriptionStr.trim() === "") {
        console.log(`  [通知スキップ] ユーザー: ${userId} の Subscription 情報が空欄です。`);
        return;
    }

    try {
        // スプレッドシートに保存されている文字列をJSONオブジェクトに復元します
        const subscription = JSON.parse(subscriptionStr);

        // プッシュ通知のペイロード（データ中身）を作成します
        // タイトルはスマホ側（Service Worker）で固定記述するため、ここでは含めず純粋なデータのみをパッキングします
        const payload = JSON.stringify({
            hourly: weatherData.hourly,
            lat: lat,
            lon: lon,
            place: place,
            lang: lang,
            unit: unit
        });

        console.log(`  -> ユーザー: ${userId} へ Web Push 通知を送信中...`);
        
        // 実際に通知を送信
        await webpush.sendNotification(subscription, payload);
        
        console.log(`  -> 正常に通知を配信しました。`);

    } catch (error) {
        console.error(`  [通知エラー] ユーザー: ${userId} への送信に失敗しました:`, error.message);
        
        // もし「410 Gone」のエラーが返ってきた場合、ユーザーがブラウザで通知を拒否したか、期限切れの古い情報であることを示します
        if (error.statusCode === 410) {
            console.log("  (提示): このSubscriptionは無効化されているため、スプレッドシートから削除することを推奨します。");
        }
    }
}

/**
 * 設定時刻が現在時刻から見て指定した時間幅（過去5分間）に含まれているか判定するサブルーチン
 * @param {string} targetTime - 整形済みの設定時刻 (HH:mm)
 * @param {string} currentTime - 現在の現地時刻 (HH:mm)
 * @param {number} windowMinutes - 判定する時間幅（分）
 * @returns {boolean} 範囲内であればtrue
 */
function isTimeInWindow(targetTime, currentTime, windowMinutes = 5) {
    if (!targetTime || !currentTime) return false;

    // "HH:mm" を時と分に分解
    const [tHour, tMinute] = targetTime.split(":").map(Number);
    const [cHour, cMinute] = currentTime.split(":").map(Number);

    // 一日の総分数に換算
    const targetMinutes = tHour * 60 + tMinute;
    const currentMinutes = cHour * 60 + cMinute;

    // 現在時刻から設定時刻を引いた差分を計算
    let diff = currentMinutes - targetMinutes;

    // 日を跨いだ場合の補正（例: 設定時刻 23:58、現在時刻 00:03 の場合、diffは -1435 になるため +1440 して 5分 とする）
    if (diff < 0) {
        diff += 1440;
    }

    // 差分が 0分以上、指定の幅（5分）未満であれば通知対象とする
    return diff >= 0 && diff < windowMinutes;
}

// -------------------------------------------------------------------------
// プログラムの実行
// -------------------------------------------------------------------------
main();
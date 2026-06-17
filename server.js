// =========================================================================
// サーバー側 処理プログラム (server.js) - Web Push通知組み込み完全版
// =========================================================================

// 必要な外部モジュールのインポート
// ※ 実際の環境に合わせて、あらかじめ npm install web-push 等を行ってください。
const webpush = require("web-push");

// main.js にある公開鍵と、お手元の秘密鍵をここに記述します
const PUBLIC_KEY = 'BJYVLMl3qqgbwsXUJAFHJsTbXgr8uB_8z1NawLGeon-cE4YpgGg3FmnSdjSzjdtVsp51Gapl53XwJ38KR5BXvjg';
const PRIVATE_KEY = 'AtbriJ02jLz1oidQBuQKa35t7A9mW_5ABqHaaqq6cZQ';

webpush.setVapidDetails(
  'mailto:ryuji.gohara@gmail.com', // 連絡先（通知が届かない時のエラー通知先となります）
  PUBLIC_KEY,
  PRIVATE_KEY
);

// GASのウェブアプリURL（環境に応じて書き換えてください）
const GAS_URL = "https://script.google.com/macros/s/AKfycbzWvf34Bhc5qEjROo69GvMeJvtW3k7_jVbTSwrkWjOFalr-yWxqlNuvKLNNWCnDZMoLgw/exec";

/**
 * メインの実行処理を管理するサブルーチン
 */
async function main() {
    console.log("=== 通知処理プログラムを開始します ===");
    try {
        // 1. GASからユーザーデータを取得
        const users = await fetchUserDataFromSpreadsheet(GAS_URL);
        
        if (!Array.isArray(users) || users.length === 0) {
            console.log("処理対象のユーザーデータが存在しないか、空の配列です。");
            return;
        }

        // 2. 各ユーザーの処理をループ実行
        for (const user of users) {
            await processUserNotification(user);
        }

    } catch (error) {
        console.error("【主処理エラー】プログラムの実行中に致命的なエラーが発生しました:", error.message);
    }
    console.log("=== 通知処理プログラムを終了します ===");
}

/**
 * 各ユーザーの時刻判定および通知準備を処理するサブルーチン
 * @param {Object} user - ユーザーデータ
 */
async function processUserNotification(user) {
    const userId = user.UserId || "(未設定)";
    const label = user.Label || "(未設定)";
    
    // ユーザーのタイムゾーンに基づいた「現在の現地時刻」を取得 (HH:mm)
    const localCurrentTime = getUserCurrentTime(user.TimeZone);
    
    // スプレッドシートの時刻表記（"7:00" など）を "07:00" 形式に整形して比較
    const targetTime = formatTimeStr(user.NotificationTime);
    
    console.log(`\n[ユーザー: ${userId} (${label})]`);
    console.log(`   設定時刻: ${targetTime} / 現在の現地時刻: ${localCurrentTime}`);
    
    // 時刻が一致しているか判定
    if (targetTime === localCurrentTime) {
        console.log("   -> ★通知対象の時間です。天気データを取得します。");
        
        if (!user.Lat || !user.Lon) {
            console.log("   [スキップ] 緯度または経度が設定されていません。");
            return;
        }
        
        try {
            // 3. Open-Meteoから一般気象データを取得（海洋気象は含まない）
            const weatherData = await fetchWeatherData(user.Lat, user.Lon);
            
            // 4. 天気概況テキストを生成 (海洋気象は除外)
            // サーバーのタイムゾーンに左右されず、判定した正確な現地時刻を反映するため localCurrentTime も渡せるよう配慮
            const summaryText = generateWeatherSummary(weatherData, label, user.TimeZone);
            
            console.log("   [生成された概況テキスト]");
            console.log("----------------------------------------");
            console.log(summaryText);
            console.log("----------------------------------------");
            
            // 【デバッグ追加】送信直前のユーザーオブジェクト内にある、元の座標・地点名データを確認
            console.log(`DEBUG [SERVER]: ユーザーオブジェクトから抽出したデータ -> Lat: ${user.Lat}, Lon: ${user.Lon}, Label: ${label}`);

            // 5. 該当ユーザーの端末へWeb Push通知を実際に送信する
            // processUserNotification 関数内の呼び出し箇所
            // 変更前: await sendWebPushNotification(user.Subscription, summaryText, userId);
            // 変更後:
            await sendWebPushNotification(user.Subscription, summaryText, userId, user.Lat, user.Lon, label);            

        } catch (err) {
            console.error(`   [エラー] 天気データ取得・生成中に失敗しました:`, err.message);
        }
    } else {
        console.log("   -> 時間外のため通知処理をスキップします。");
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

    // GASのリダイレクト（302）を確実に追従させるため redirect: "follow" を明示
    const response = await fetch(url, { redirect: "follow" });
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
            hour12: false, // 24時間表記（07:00 や 23:15 など）に固定します
            hourCycle: "h23" // 深夜0時台が環境依存で "24:xx" になる挙動を防ぎ、確実に "00:xx" に統一します
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
 * Open-Meteo APIから一般気象データを取得するサブルーチン（海洋気象は含まない）
 * @param {number|string} lat - 緯度
 * @param {number|string} lon - 経度
 * @returns {Promise<Object>} 気象データのJSONオブジェクト
 */
async function fetchWeatherData(lat, lon) {
    // 風速を m/s で取得するために &wind_speed_unit=ms を付与しています
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m&daily=temperature_2m_max,temperature_2m_min&wind_speed_unit=ms&timezone=auto`;
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Open-Meteo API 通信エラー (ステータス: ${response.status})`);
    }
    return await response.json();
}

/**
 * Weather Code（WMO準拠）を日本語の天気文字列に変換するサブルーチン
 * @param {number} code - 天気コード
 * @returns {string} 日本語の天気名
 */
function getWeatherDescription(code) {
    const codeMap = {
        0: "晴れ",
        1: "概ね晴れ", 2: "薄曇り", 3: "曇り",
        45: "霧", 48: "着氷性の霧",
        51: "弱い霧雨", 53: "霧雨", 55: "強い霧雨",
        61: "弱い雨", 63: "雨", 65: "強い雨",
        71: "弱い雪", 73: "雪", 75: "強い雪",
        77: "ひょう",
        80: "弱いにわか雨", 81: "にわか雨", 82: "激しいにわか雨",
        85: "弱いにわか雪", 86: "激しいにわか雪",
        95: "雷雨", 96: "ひょうを伴う雷雨", 99: "激しいひょうを伴う雷雨"
    };
    return codeMap[code] || "不明";
}

/**
 * 風向きの度数（0-360）を16方位の日本語文字列に変換するサブルーチン
 * @param {number} degree - 風向（度）
 * @returns {string} 16方位の文字列
 */
function getWindDirectionStr(degree) {
    const directions = [
        "北", "北北東", "北東", "東北東",
        "東", "東南東", "南東", "南南東",
        "南", "南南西", "南西", "西南西",
        "西", "西北西", "北西", "北北西"
    ];
    const index = Math.round(degree / 22.5) % 16;
    return directions[index];
}

/**
 * 取得した気象データから概況テキストを生成するサブルーチン（海洋気象は完全に除外）
 * @param {Object} weatherData - Open-Meteoから取得したデータ
 * @param {string} label - 地点名
 * @param {string} [timeZone] - ユーザーのタイムゾーン（指定された拠点の正確な日付を取得するために使用）
 * @returns {string} 生成された概況テキスト
 */
function generateWeatherSummary(weatherData, label, timeZone = "Asia/Tokyo") {
    const current = weatherData.current;
    const daily = weatherData.daily;
    
    // 現在の状態の抽出
    const currentWeatherStr = getWeatherDescription(current.weather_code);
    const windSpeed = current.wind_speed_10m;
    const windDirStr = getWindDirectionStr(current.wind_direction_10m);
    
    // 本日の最高・最低気温の抽出
    const maxTemp = daily.temperature_2m_max[0];
    const minTemp = daily.temperature_2m_min[0];
    
    // サーバーの設置環境（UTC等）に引きずられず、対象ユーザーの現地日時でテキストを印字する補正
    const now = new Date();
    const targetTz = timeZone && timeZone.trim() !== "" ? timeZone : "UTC";
    
    const localDateStr = now.toLocaleDateString("en-US", { timeZone: targetTz });
    const localDateObj = new Date(localDateStr);
    
    const month = localDateObj.getMonth() + 1;
    const date = localDateObj.getDate();
    const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
    const dayOfWeek = dayNames[localDateObj.getDay()];
    
    // 時刻文字列は既に検証済みの形式を抽出し、確実に同期させます
    const [hours, minutes] = getUserCurrentTime(targetTz).split(":");
    
    // 概況テキストの組み立て
    let summary = `【概況】 ${label}：${month}/${date}(${dayOfWeek}) ${hours}:${minutes} 現在\n`;
    summary += `現在は${currentWeatherStr}です。気温は最高${maxTemp.toFixed(1)}℃、最低は${minTemp.toFixed(1)}℃で、落ち着いた推移となるでしょう。\n`;
    summary += `風は現在${windDirStr}の風が${windSpeed.toFixed(1)}m/sです。今後24時間、${windDirStr}寄りの風が続く見込みです。`;
    
    return summary;
}

/**
 * 該当ユーザーの端末へ Web Push 通知を送信するサブルーチン
 * @param {string} subscriptionStr - スプレッドシートから取得したSubscriptionのJSON文字列
 * @param {string} messageText - 送信する通知の本文（概況テキスト）
 * @param {string} userId - ユーザーID（ログ出力用）
 */

async function sendWebPushNotification(subscriptionStr, messageText, userId, userLat, userLon, userLabel) {
    if (!subscriptionStr || subscriptionStr.trim() === "") {
        console.log(`   [通知スキップ] ユーザー: ${userId} の Subscription 情報が空欄です。`);
        return;
    }

    try {
        const subscription = JSON.parse(subscriptionStr);

        // 【修正】地点情報をペイロードに追加
        const payload = JSON.stringify({
            title: "気象アラート",
            body: messageText,
            icon: "/icon.png",
            lat: userLat,
            lon: userLon,
            place: userLabel
        });

        console.log("DEBUG [SERVER]: 送出する生のペイロードデータ (JSON):", payload);

        await webpush.setVapidDetails(/* ...鍵情報... */); // 鍵設定はそのまま
        await webpush.sendNotification(subscription, payload);
        
        console.log(`   -> 正常に通知を配信しました。`);

    } catch (error) {
        console.error(`   [通知エラー] ユーザー: ${userId} への送信に失敗しました:`, error.message);
    }
}

// -------------------------------------------------------------------------
// プログラムの実行
// -------------------------------------------------------------------------
main();
// ======================================================================================
// PWA サービスワーカー (staticフォルダ配置版)
// ======================================================================================
const CACHE_NAME = 'pin-weather-cache-v1';
const ASSETS_TO_CACHE = [
  '../index.html',
  './manifest.json',
  '../css/style.css',
  '../js/main.js'
];

// インストール時
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

// アクティベート時
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated');
});

// フェッチ時 (ネットワーク優先)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

// pushイベントを受け取るリスナー
self.addEventListener('push', (event) => {
  event.waitUntil(displayNotification(event));
});

// 【追加】通知クリックイベントのリスナー登録
self.addEventListener('notificationclick', (event) => {
  event.waitUntil(handleNotificationClick(event));
});

/**
 * サーバーから受信したデータを解析し、通知ポップアップを表示するサブルーチン
 * デバッグ内容：サーバーから到達した生のデータ（テキスト）を冒頭で出力。
 * @param {ExtendableEvent} event 
 */
async function displayNotification(event) {
  let title = '【24時間概況】'; // ご指定通りデフォルトのタイトルを「【24時間概況】」に変更
  let options = {
    body: '新しい天気情報があります。',
    icon: '/icon.png',
    data: {} // 座標と地名を安全に引き渡すためのカスタムデータ領域
  };

  if (event.data) {
    try {
      // 【デバッグ追加】サーバーから届いた生のペイロード文字列をそのまま出力
      console.log("DEBUG [SW]: 0. サーバーから受信した生のデータ(テキスト):", event.data.text());

      const data = event.data.json();
      title = data.title || title;
      options.body = data.body || options.body;
      options.icon = data.icon || options.icon;
      
      // サーバー側の通知ペイロードから lat, lon, place を抽出して格納
      options.data.lat = data.lat || null;
      options.data.lon = data.lon || null;
      options.data.place = data.place || null;
      title = `【${data.place || "不明な地点"}の24時間概況】`; // タイトルに地点名を反映

      // 【追加ロジック】気象データ(hourly)が含まれている場合、3時間おき4行サマリーを動的に組み立ててbodyを上書き
      if (data.hourly) {
        const lang = data.lang || 'ja'; // サーバーペイロードから言語を取得（なければ 'ja'）
        const unit = data.unit || 'ms'; // サーバーペイロードから単位を取得（なければ 'ms'）
        const summaryBody = buildNotificationBody(data, lang, unit);
        if (summaryBody) {
          options.body = summaryBody;
        }
      }
    } catch (e) {
      options.body = event.data.text();
    }
  }

  return self.registration.showNotification(title, options);
}

/**
 * 通知ポップアップがクリックされた時の遷移・フォーカス処理を行うサブルーチン
 * 修正内容：既存ウィンドウが存在する場合、ナビゲート成否に関わらず新規起動(すり抜け)を絶対させない構造にガード。
 * @param {NotificationEvent} event 
 */
async function handleNotificationClick(event) {
  console.log("DEBUG [SW]: 1. 通知クリックイベントを検知しました。");

  // クリックされた通知を閉じる
  event.notification.close();

  const notificationData = event.notification.data || {};
  console.log("DEBUG [SW]: 2. 通知から受け取ったデータ (data):", notificationData);

  const lat = notificationData.lat;
  const lon = notificationData.lon;
  const place = notificationData.place;

  // アプリのルートURLをベースに設定
  let targetUrl = new URL('/', self.location.origin);

  // 座標データが存在する場合は、URLパラメータを組み立てて付与（widgetモードは指定しない）
  if (lat && lon) {
    targetUrl.searchParams.set('lat', lat);
    targetUrl.searchParams.set('lon', lon);
    if (place) {
      targetUrl.searchParams.set('place', place);
    }
  }

  const targetUrlString = targetUrl.toString();
  console.log("DEBUG [SW]: 3. 生成されたターゲットURL:", targetUrlString);

  // 既にアプリのウィンドウが開いているかチェック
  const clientList = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  });
  console.log(`DEBUG [SW]: 4. マッチした既存ウィンドウ数: ${clientList.length} 件`);

  // 既存のウィンドウがある場合は、そちらの制御に一任する（すり抜けガード構造）
  if (clientList.length > 0) {
    for (const client of clientList) {
      console.log("DEBUG [SW]: 5. 走査中のクライアントURL:", client.url);
      if ('navigate' in client) {
        try {
          console.log("DEBUG [SW]: 6. 既存ウィンドウのURL書き換えを実行します:", targetUrlString);
          await client.navigate(targetUrlString);
          console.log("DEBUG [SW]: 7. 既存ウィンドウへフォーカス（前面表示）を要求します。");
          
          // フォーカス処理をawaitして結果をログ出力
          const focusedClient = await client.focus();
          console.log("DEBUG [SW]: 7-結果. フォーカス処理のPromiseが解決されました。オブジェクト:", focusedClient);
          
          return focusedClient;
        } catch (err) {
          console.error('Failed to navigate existing client:', err);
          // サービスワーカーの新旧不整合等でURL書き換えに失敗した場合でも、多重起動（真っ白）を防ぐため画面フォーカスのみ試みる
          try {
            console.log("DEBUG [SW]: 7-補足. ナビゲート失敗のため、既存ウィンドウのフォーカスのみ要求します。");
            
            // 補足側のフォーカス処理もawaitして結果をログ出力
            const focusedClient補足 = await client.focus();
            console.log("DEBUG [SW]: 7-補足結果. フォーカス処理のPromiseが解決されました。オブジェクト:", focusedClient補足);
            
            return focusedClient補足;
          } catch (fErr) {
            console.error('Failed to focus existing client:', fErr);
          }
        }
      }
    }
    // 既存ウィンドウが存在していた場合は、処理の成否に関わらずここで安全に終了させ、末尾のopenWindowに突入させない
    return;
  }

  // 開いているウィンドウがない場合は、新しくウィンドウを開いて起動
  if (self.clients.openWindow) {
    console.log("DEBUG [SW]: 8. 既存ウィンドウがありません。新規ウィンドウを開きます:", targetUrlString);
    return self.clients.openWindow(targetUrlString);
  }
}

// ======================================================================================
// 【追加】3時間おき・4行サマリー通知テキスト生成サブルーチン群
// ======================================================================================

/**
 * 1. 多言語化のための固定辞書オブジェクト
 */
const I18N_DICT = {
    ja: {
        hours: "時",
        maxPrecip: "最大降水量",
        wind: "風",
        directions: ["北", "北北東", "北東", "東北東", "東", "東南東", "南東", "南南東", "南", "南南西", "南西", "西南西", "西", "西北西", "西北", "北西北"]
    },
    en: {
        hours: "h",
        maxPrecip: "Max Precip",
        wind: "Wind",
        directions: ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    }
};

/**
 * 2. 現在時刻（JST）が属するOpen-Meteo hourly配列のインデックスを検索するサブルーチン
 * @param {string[]} timeArray - ISO8601形式の時刻文字列配列
 * @returns {number} 現在時刻に最も近いインデックス（見つからない場合は0）
 */
function findCurrentTimeIndex(timeArray) {
    const now = new Date();
    let closestIndex = 0;
    let minDiff = Infinity;

    for (let i = 0; i < timeArray.length; i++) {
        const targetDate = new Date(timeArray[i]);
        const diff = Math.abs(now - targetDate);
        if (diff < minDiff) {
            minDiff = diff;
            closestIndex = i;
        }
    }
    // 3時間ブロックの先頭に合わせるため、3の倍数に丸める（例：14時なら12時（インデックス12）を起点にする）
    return closestIndex - (closestIndex % 3);
}

/**
 * 3. WMO気象コードを1文字の絵文字に変換するサブルーチン
 * 修正内容：main.jsの weatherIcons 条件と100%完全に一致するようマッピングを修正
 * @param {number} code - WMO Weather Code
 * @returns {string} 天気絵文字
 */
function getWeatherEmoji(code) {
    const weatherIcons = { 
        0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️", 
        45: "🌫️", 48: "🌫️", 
        51: "🌦️", 53: "🌦️", 55: "🌦️", 
        61: "🌧️", 63: "🌧️", 65: "🌧️", 
        71: "❄️", 73: "❄️", 75: "❄️", 
        80: "🌦️", 81: "🌦️", 82: "🌦️", 
        95: "⛈️", 96: "⛈️", 99: "⛈️" 
    };
    // マッピングに存在しないコードが万が一届いた場合は、デフォルトとして「☁️」を返す安全設計
    return weatherIcons[code] || "☁️";
}

/**
 * 4. 角度から16方位の文字列を取得するサブルーチン
 * @param {number} degree - 0〜360度
 * @param {string} lang - 言語コード ('ja' または 'en')
 * @returns {string} 方位文字列
 */
function getWindDirectionStr(degree, lang) {
    const dict = I18N_DICT[lang] || I18N_DICT["ja"];
    const index = Math.floor(((degree + 11.25) % 360) / 22.5);
    return dict.directions[index];
}

/**
 * 5. 風速をユーザー指定の単位に変換し、切り捨てるサブルーチン
 * @param {number} speedMs - m/s単位の風速（小数）
 * @param {string} unit - 単位設定 ('ms' または 'kn')
 * @returns {number} 切り捨てられた整数の風速値
 */
function convertAndFloorWindSpeed(speedMs, unit) {
    if (unit === "kn") {
        // 1 m/s = 1.94384 knots
        return Math.floor(speedMs * 1.94384);
    }
    return Math.floor(speedMs);
}

/**
 * 6. 3時間分のデータブロックから1行のテキストを組み立てるサブルーチン
 * 修正内容：ユーザー指定のフォーマット（例: 00:00-）に合わせてコロン位置とスペース配置を調整
 * @param {Object} hourly - Open-Meteo of hourly object
 * @param {number} startIndex - 3時間ブロックの開始インデックス
 * @param {string} lang - 言語コード ('ja' または 'en')
 * @param {string} unit - 風速単位 ('ms' または 'kn')
 * @returns {string} 整形された1行のテキスト
 */
function formatThreeHourLine(hourly, startIndex, lang, unit) {
    const dict = I18N_DICT[lang] || I18N_DICT["ja"];
    const unitStr = unit === "kn" ? "kn" : "m/s";

    // 日付・時刻の取得 (インデックスの最初の時刻を基準にする)
    const baseDate = new Date(hourly.time[startIndex]);
    const month = String(baseDate.getMonth() + 1).padStart(2, '0');
    const day = String(baseDate.getDate()).padStart(2, '0');
    
    // 曜日の取得
    const weekdays = lang === "en" ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] : ["日", "月", "火", "水", "木", "金", "土"];
    const weekdayStr = weekdays[baseDate.getDay()];

    // 時刻文字列の生成（修正: ユーザー指定の開始時刻＋コロン形式「00:00-」へ変更）
    const startHour = String(baseDate.getHours()).padStart(2, '0');
    const timeRange = `${startHour}:00-`;

    // ① 天気絵文字を3つ並べる
    const code1 = hourly.weather_code[startIndex];
    const code2 = hourly.weather_code[startIndex + 1];
    const code3 = hourly.weather_code[startIndex + 2];

    const emoji1 = getWeatherEmoji(code1);
    const emoji2 = getWeatherEmoji(code2);
    const emoji3 = getWeatherEmoji(code3);
    const emojis = `${emoji1}${emoji2}${emoji3}`;

    // 【デバッグ出力】この行で参照した3時間の天気コードと変換結果の絵文字を正確に確認
    console.log(`DEBUG [SW] 行生成時刻 [${timeRange}] -> インデックス: ${startIndex}〜${startIndex+2}`);
    console.log(`  -> 生天気コード: [${code1}, ${code2}, ${code3}]`);
    console.log(`  -> 変換後絵文字: ${emojis}`);

    // ② 最大降水量の計算（3時間の中の最大値を抽出して切り捨て）
    const maxPrecip = Math.floor(
        Math.max(
            hourly.precipitation[startIndex],
            hourly.precipitation[startIndex + 1],
            hourly.precipitation[startIndex + 2]
        )
    );

    // ③ 風向（1つ目の時間帯）と風速推移（1つ目 → 3つ目）の計算
    const windDirStr = getWindDirectionStr(hourly.wind_direction_10m[startIndex], lang);
    const windSpeedStart = convertAndFloorWindSpeed(hourly.wind_speed_10m[startIndex], unit);
    const windSpeedEnd = convertAndFloorWindSpeed(hourly.wind_speed_10m[startIndex + 2], unit);

    // 1行のテキストへ結合（末尾の区切りコロンをスペースに変更し、ご指定通りの「00:00- 」の間隔を厳密に維持）
    return `${month}/${day}(${weekdayStr}) ${timeRange} ${emojis} ${maxPrecip}mm ${windDirStr} ${windSpeedStart} → ${windSpeedEnd}${unitStr}`;
}

/**
 * 7. 【メインルーチン】現在時刻起点で4行（12時間分）の通知本文を生成するサブルーチン
 * @param {Object} weatherData - サーバーから受信したAPIデータオブジェクト
 * @param {string} lang - ユーザーの言語設定 ('ja' / 'en')
 * @param {string} unit - ユーザーの単位設定 ('ms' / 'kn')
 * @returns {string} 通知のbodyに設定する最終文字列
 */
function buildNotificationBody(weatherData, lang, unit) {
    const hourly = weatherData.hourly;
    if (!hourly) {
        console.warn("DEBUG [SW]: hourlyデータが存在しません。");
        return "";
    }

    // 現在時刻が属するインデックス（3の倍数）を特定
    let currentIndex = findCurrentTimeIndex(hourly.time);
    console.log(`DEBUG [SW]: buildNotificationBody 開始時の起点インデックス: ${currentIndex} (時刻: ${hourly.time[currentIndex]})`);
    
    const lines = [];
    // 3時間おきに4回（計12時間分）ループ処理を行う
    for (let i = 0; i < 4; i++) {
        // 2日分のデータ（インデックス47まで）を超えないよう安全マージンを設定
        if (currentIndex + 2 < hourly.time.length) {
            const line = formatThreeHourLine(hourly, currentIndex, lang, unit);
            lines.push(line);
        } else {
            console.warn(`DEBUG [SW]: インデックス ${currentIndex} がデータの長さ ${hourly.time.length} を超えるためスキップされました。`);
        }
        currentIndex += 3; // 次の3時間ブロックへ
    }

    return lines.join("\n");
}
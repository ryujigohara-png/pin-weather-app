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
  let title = '気象アラート';
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
          return client.focus();
        } catch (err) {
          console.error('Failed to navigate existing client:', err);
          // サービスワーカーの新旧不整合等でURL書き換えに失敗した場合でも、多重起動（真っ白）を防ぐため画面フォーカスのみ試みる
          try {
            console.log("DEBUG [SW]: 7-補足. ナビゲート失敗のため、既存ウィンドウのフォーカスのみ要求します。");
            return client.focus();
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
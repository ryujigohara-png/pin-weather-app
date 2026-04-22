// 1. データの入れ物
let allData = {};

// 2. 詳細設定の初期値
const defaultViewConfig = {
    forecastDays: 16,           // 予報日数（最大16日）
    tooltipDuration: 3,         // ツールチップ表示時間（s）
    temperatureUnit: 'celsius', // 気温単位
    windSpeedUnit: 'ms',        // 風速単位
    // --- 風速色付け閾値（初期値） ---
    windThresholdHigh: 10.0,
    windThresholdMid: 5.0,
    windThresholdLow: 3.0,
    // ----------------------------
    iconScale: 0.7,             // 風向アイコン倍率
    hourWidth: 20,              // 1時間の幅
    windHeight: 180,            // 風速グラフ高さ
    subHeight: 100,             // 気温・海象グラフ高さ
    graphMargin: 0,             // グラフ間余白
    fontSize: 12,               // ラベルフォントサイズ
    language: 'ja'              // 言語設定
};

// 3. localStorage からの読み込みとマージ
const savedConfig = JSON.parse(localStorage.getItem('pin_weather_view_config')) || {};
let viewConfig = { ...defaultViewConfig, ...savedConfig };

// ★重要：ここで先に i18n を定義する！！
const i18n = {
    _currentLang: viewConfig.language || 'ja',
    setLang(lang) {
        this._currentLang = lang;
        // 設定を保存
        viewConfig.language = lang;
        localStorage.setItem('pin_weather_view_config', JSON.stringify(viewConfig));
        
        // UIの即時更新とセレクトボックス同期
        if (typeof updateStaticUI === 'function') updateStaticUI();
        updateLanguageSelect();
        
        // 言語切り替え時はリロードして整合性を確保
        location.reload();
    },
    dict: {
        'ja': {
            // --- グラフ・ツールチップ用 ---
            days: ["日", "月", "火", "水", "木", "金", "土"],
            months: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
            precip: "降水量",
            windDir: "風向",
            windSpeed: "風速",
            temp: "気温",
            seawater: "海水温",
            wave: "波高",
            tide: "潮位",
            nowTime: "現在時刻(端末)",
            fetchTime: "データ取得(端末)",

            // --- サイドバー・基本UI ---
            btnPwaInstall: "📲 アプリをインストール",
            iosInstallTitle: "iPhoneをご利用の方へ",
            iosInstallGuide: "Safariの「共有ボタン（□に↑）」を押し、「ホーム画面に追加」を選択してください。",
            btnWindConfig: "🎐 風向色付設定",
            btnDetailSettings: "⚙ 表示詳細設定",
            btnResetAll: "♻️ 全リセット",
            btnFeedback: "💬 ご意見・ご要望",
            linkAboutAndPrivacy: "運営者情報 ＆ プライバシーポリシー",
            shareQR: "スマホで共有",
            btnCopyUrl: "🔗 URLをコピー",
            copySuccess: "✅ コピー完了！",
            copyError: "コピーに失敗しました。",

            // --- 地図・地点登録モーダル ---
            mapClickGuide: "地点をクリックしてください",
            btnSearch: "検索",
            btnSaveSpot: "MySpotsに登録",
            btnTempView: "グラフ表示",
            btnClose: "キャンセル", 
            limitReached: "10箇所までしか登録できません。これ以上追加する場合は、既存の地点を長押しまたは右クリックして削除してください。",
            mapStatusFetching: "地点情報を取得中...",
            mapStatusFail: "地点名取得失敗",
            mapNewSpot: "新規地点",
            mapSavePrompt: "登録する地点名を確認・修正してください",
            layerStreet: "標準地図",
            layerSatellite: "衛星写真",
            layerGSI: "地理院地図",
            layerRain: "雨雲レーダー",
            // --- 風向設定モーダル ---
            windModalTitle: "色付けする風向を選択",
            compassCenterText: "中央をクリックで<br>全選択 / 解除",
            btnApply: "変更して登録",

            // --- 表示詳細設定モーダル ---
            settingsTitle: "グラフ表示詳細設定",
            configLangTitle: "Language / 表示言語",
            cfgForecastDays: "予報日数 (最大16日)",
            cfgHourWidth: "1時間の幅 (hScale)",
            cfgWindHeight: "風速グラフの高さ",
            cfgSubHeight: "気温・海象グラフの高さ",
            cfgMargin: "グラフ間の余白",
            cfgFontSize: "ラベル文字サイズ",
            cfgIconScale: "風向アイコン倍率",
            cfgTooltipDuration: "詳細情報の表示時間", // 「ツールチップ表示時間」から変更
            cfgTempUnit: "温度単位",
            cfgWindUnit: "風速単位",
            cfgWindThresholds: "風速色付しきい値",
            saveGuideText: "※保存するとページが再読み込みされ、設定が反映されます。",
            btnSaveSettings: "設定を保存",
            btnRestoreDefault: "デフォルトに戻す",

            // --- グラフ軸・凡例・その他（動的対応版） ---
            yAxisWeather: "天気<br>降水(mm)",
            yAxisWind: `風向<br>風速(${viewConfig.windSpeedUnit === 'ms' ? 'm/s' : viewConfig.windSpeedUnit === 'kn' ? 'kn' : viewConfig.windSpeedUnit === 'kmh' ? 'km/h' : 'mph'})`,
            yAxisTemp: `気温(${viewConfig.temperatureUnit === 'celsius' ? '℃' : '℉'})<br>海水(${viewConfig.temperatureUnit === 'celsius' ? '℃' : '℉'})`,
            yAxisMarine: "波高(m)<br>潮位(m)",
            legendWindTitle: "風向色付：",
            speedunit: viewConfig.windSpeedUnit === 'ms' ? 'm/s' : viewConfig.windSpeedUnit === 'kn' ? 'kn' : viewConfig.windSpeedUnit === 'kmh' ? 'km/h' : 'mph',
            disclaimer: "【免責事項】海上気象データは予測モデルに基づく「最寄りの海上地点」の数値であり、実際の局地的な地形や潮流による影響を反映しきれない場合があります。",
            
            // --- メッセージ類 ---
            welcomeGuide: "表示したい地点を登録してください。現在地を取得するか、地図から場所を選択できます。登録は画面上部の地名タブを長押しまたは右クリックしてください。",
            confirmDelete: (name) => `「${name}」を削除しますか？`,
            confirmInit: "初期化しますか？",
            confirmReset: "表示設定をデフォルトに戻しますか？",
            gpsFetching: "取得中...",
            gpsError: "位置情報の取得に失敗しました。",
            gpsDefaultLabel: "現在地(GPS)",
            noLocationError: "地点情報がありません。",
            editSpotGuide: "地点名を編集、または削除します",
            btnDelete: "削除",
            confirmDeletePrefix: "本当に削除しますか："
        },
        'en': {
            // --- Graph & Tooltip ---
            days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
            months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            precip: "Precip",
            windDir: "Wind",
            windSpeed: "Speed",
            temp: "Temp",
            seawater: "Sea Temp",
            wave: "Wave",
            tide: "Tide",
            nowTime: "Current(Device)",
            fetchTime: "Fetched(Device)",

            // --- Sidebar & Base UI ---
            btnPwaInstall: "📲 Install App",
            iosInstallTitle: "For iPhone Users",
            iosInstallGuide: "Tap the 'Share button' in Safari and select 'Add to Home Screen'.",
            btnWindConfig: "🎐 Wind Color Settings",
            btnDetailSettings: "⚙ Display Settings",
            btnResetAll: "♻️ Reset All Spots",
            btnFeedback: "💬 Feedback & Requests",
            linkAboutAndPrivacy: "About & Privacy Policy",    
            shareQR: "Share with Mobile",
            btnCopyUrl: "🔗 Copy URL",
            copySuccess: "✅ Copied!",
            copyError: "Failed to copy.",

            // --- Map & Spot Modal ---
            mapClickGuide: "Click on the map",
            btnSearch: "Search",
            btnSaveSpot: "Save to MySpots",
            btnTempView: "View Graph",
            btnClose: "Cancel",
            limitReached: "Maximum of 10 spots allowed. Please delete an existing spot to add a new one.",
            mapStatusFetching: "Fetching location info...",
            mapStatusFail: "Failed to get location name",
            mapNewSpot: "New Spot",
            mapSavePrompt: "Please confirm or edit the spot name",
            layerStreet: "Street",
            layerSatellite: "Satellite",
            layerGSI: "GSI Map",
            layerRain: "Precipitation",

            // --- Wind Modal ---
            windModalTitle: "Select Wind Directions to Color",
            compassCenterText: "Click Center to<br>Select/Deselect All",
            btnApply: "Apply Changes",

            // --- Detail Settings Modal ---
            settingsTitle: "Detailed Display Settings",
            configLangTitle: "Language",
            cfgForecastDays: "Forecast Days (Max 16)",
            cfgHourWidth: "Hour Width (hScale)",
            cfgWindHeight: "Wind Graph Height",
            cfgSubHeight: "Sub Graph Height",
            cfgMargin: "Graph Margin",
            cfgFontSize: "Font Size",
            cfgIconScale: "Icon Scale",
            cfgTooltipDuration: "Info Display Duration", // Changed from "Tooltip Display Time",
            cfgTempUnit: "Temperature Unit",
            cfgWindUnit: "Wind Speed Unit",
            cfgWindThresholds: "Wind Coloring Thresholds",
            saveGuideText: "*Saving will reload the page to apply settings.",
            btnSaveSettings: "Save Settings",
            btnRestoreDefault: "Restore Default",

            // --- Axes, Legends, etc.（動的対応版） ---
            yAxisWeather: "Weather<br>Precip(mm)",
            yAxisWind: `Wind Dir<br>Speed(${viewConfig.windSpeedUnit === 'ms' ? 'm/s' : viewConfig.windSpeedUnit === 'kn' ? 'kn' : viewConfig.windSpeedUnit === 'kmh' ? 'km/h' : 'mph'})`,
            yAxisTemp: `Temp(${viewConfig.temperatureUnit === 'celsius' ? '°C' : '°F'})<br>Sea(${viewConfig.temperatureUnit === 'celsius' ? '°C' : '°F'})`,
            yAxisMarine: "Wave(m)<br>Tide(m)",
            legendWindTitle: "Wind Color:",
            speedunit: viewConfig.windSpeedUnit === 'ms' ? 'm/s' : viewConfig.windSpeedUnit === 'kn' ? 'kn' : viewConfig.windSpeedUnit === 'kmh' ? 'km/h' : 'mph',            disclaimer: "[Disclaimer] Marine weather data is based on forecast models for the 'nearest sea point' and may not reflect local terrain or tidal effects.",

            // --- Messages ---
            welcomeGuide: "Please register the locations you want to display. You can get your current location or select a place from the map. To register, long-press or right-click on the location tab at the top of the screen.",
            confirmDelete: (name) => `Delete "${name}"?`,
            confirmInit: "Initialize all spots?",
            confirmReset: "Reset all view settings to default?",
            gpsFetching: "Locating...",
            gpsError: "Failed to get location.",
            gpsDefaultLabel: "GPS Location",
            noLocationError: "No location information available.",
            editSpotGuide: "Edit or delete the spot name",
            btnDelete: "Delete",
            confirmDeletePrefix: "Are you sure you want to delete:"
        }
    },
    t(key) { 
        return this.dict[this._currentLang][key] || key; 
    }
};

/**
 * 言語設定の初期表示を現在の言語に合わせる処理
 */
function updateLanguageSelect() {
    const langSelect = document.getElementById('sidebar-language-select');
    if (langSelect) {
        langSelect.value = i18n._currentLang; 
    }
}

/**
 * UIの静的テキストを現在の言語で一斉更新する関数
 */
function updateStaticUI() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.innerHTML = i18n.t(key);
    });
}

// ==========================================
// 4. 風向マスターと言語互換ロジック
// ==========================================
const jaDirs = ["北", "北北東", "北東", "東北東", "東", "東南東", "南東", "南南東", "南", "南南西", "南西", "西南西", "西", "西北西", "北西", "北北西"];
const enDirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];

// 表示用の基本風向リスト（現在の言語に合わせる）
const windDirs = i18n._currentLang === 'ja' ? [...jaDirs] : [...enDirs];

// localStorage から保存されたフィルタを読み込み、現在の言語に「強制変換」して同期させる
let rawSavedDirections = JSON.parse(localStorage.getItem('pin_weather_wind_filter')) || [...windDirs];

let targetWindDirections = rawSavedDirections.map(val => {
    if (i18n._currentLang === 'en') {
        const idx = jaDirs.indexOf(val);
        return idx !== -1 ? enDirs[idx] : val;
    } else {
        const idx = enDirs.indexOf(val);
        return idx !== -1 ? jaDirs[idx] : val;
    }
});

// ==========================================
// 5. 定数とDOM初期化
// ==========================================
const hScale = viewConfig.hourWidth; 
const CACHE_DURATION = 4 * 60 * 60 * 1000; 

window.addEventListener('DOMContentLoaded', () => {
    updateStaticUI();
    updateLanguageSelect();
    const langSelect = document.getElementById('config-language');
    if (langSelect) { langSelect.value = i18n._currentLang; }
});

const defaultSpots = [
    {lat: 31.337, lon: 130.795, label: "高須沖(鹿児島県)"},
    {lat: 35.30, lon: 139.48, label: "江の島沖(神奈川県)"}
];

/**
 * ブラウザを閉じる、またはタブを離れる際に古いキャッシュを一括掃除
 */
window.addEventListener('beforeunload', () => {
    const now = Date.now();
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('weather_cache_')) {
            try {
                const item = JSON.parse(localStorage.getItem(key));
                // 4時間以上前のものは削除
                if (item && item.timestamp && (now - item.timestamp > CACHE_DURATION)) {
                    localStorage.removeItem(key);
                }
            } catch (e) {
                localStorage.removeItem(key);
            }
        }
    });
});

// 保存データを確認
const savedSpotsRaw = localStorage.getItem('pin_weather_spots');
let mySpots = defaultSpots; // 最初からデフォルトを入れておく

try {
    if (savedSpotsRaw) {
        const parsed = JSON.parse(savedSpotsRaw);
        // 空配列 [] でない場合のみ、保存データで上書きする
        if (Array.isArray(parsed) && parsed.length > 0) {
            mySpots = parsed;
        }
    }
} catch (e) {
    console.error("Storage parse error:", e);
    mySpots = defaultSpots;
}

// ここで mySpots[0] は必ず存在するため、エラーは出ません
let currentLat = mySpots[0].lat;
let currentLon = mySpots[0].lon;
let currentLabel = mySpots[0].label;

let map, tempMarker;

function updateStaticUI() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        // confirmDelete のような関数型データでない場合のみ text を置換
        if (typeof i18n.dict[i18n._currentLang][key] === 'string') {
            el.innerHTML = i18n.t(key); // HTMLタグを含む場合があるため innerHTML を使用
        }
    });
}

/**
 * 言語設定に基づいた日付文字列を返す
 * @param {Date} dateObj 
 * @returns {string}
 */
function getLocalizedDate(dateObj) {
    const d = dateObj.getDate();
    const w = dateObj.getDay();
    const m = dateObj.getMonth();

    if (i18n._currentLang === 'ja') {
        // 日本語形式: 4/1(水)
        return `${m + 1}/${d}(${i18n.dict.ja.days[w]})`;
    } else {
        // 英語形式: Wed, Apr 1st
        let suffix = "th";
        if (d % 10 === 1 && d !== 11) suffix = "st";
        else if (d % 10 === 2 && d !== 12) suffix = "nd";
        else if (d % 10 === 3 && d !== 13) suffix = "rd";
        
        const dayName = i18n.dict.en.days[w];
        const monthName = i18n.dict.en.months[m];
        return `${dayName}, ${monthName} ${d}${suffix}`;
    }
}

/**
 * サブルーチン：HTML上の静的テキストを現在の言語で一斉更新
 */
function updateStaticUI() {
    // 1. data-i18n 属性を持つすべての要素をループ処理
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translation = i18n.t(key);

        // 翻訳が存在する場合のみ処理
        if (translation && translation !== key) {
            // confirmDelete のような関数型データは除外（個別のダイアログ等で使用するため）
            if (typeof translation === 'string') {
                // 免責事項や軸ラベルには <br> 等が含まれるため innerHTML を使用
                el.innerHTML = translation;
            }
        }
    });

    // 2. プレースホルダー（検索窓）の個別対応
    const searchInput = document.getElementById('map-search-input');
    if (searchInput) {
        searchInput.placeholder = i18n._currentLang === 'ja' 
            ? "地名・施設名を入力して検索..." 
            : "Search location...";
    }

    // 3. 設定画面のセレクトボックスの状態を現在の言語に同期
    const langSelect = document.getElementById('config-language');
    if (langSelect) {
        langSelect.value = i18n._currentLang;
    }
}


/**
 * サブルーチン：詳細設定モーダルの初期化
 * HTML側に onclick を書かず、JS側で全てのイベントを紐付ける。
 */
function initViewSettings() {
    const modal = document.getElementById('viewSettingsModal');
    const openBtn = document.getElementById('openSettingsBtn'); // サイドバーのボタン
    const closeBtn = document.getElementById('closeViewSettings'); // モーダル内の閉じるボタン
    const saveBtn = document.getElementById('saveViewSettings'); // モーダル内の保存ボタン
    const resetBtn = document.getElementById('resetViewSettings'); // リセットボタン

    if (!modal || !openBtn) return;

    // 1. サイドバーのボタンを押した時の動作
    openBtn.addEventListener('click', () => {
        syncSliderValues();
        openModal('viewSettingsModal');
    });

    // 2. 閉じるボタン
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            closeModal('viewSettingsModal');
        });
    }

    // 3. 保存ボタン
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            saveViewSettings();
        });
    }

    // 4. リセットボタンのイベント紐付け
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            resetViewSettings();
        });
    }

    // 5. スライダーを動かした時の数値リアルタイム表示
    const configIds = ['hourWidth', 'windHeight', 'subHeight', 'margin', 'fontSize', 'iconScale', 'tooltipDuration', 'forecastDays'];
    configIds.forEach(id => {
        const input = document.getElementById(`input-${id}`);
        if (input) {
            input.oninput = () => {
                const valSpan = document.getElementById(`val-${id}`);
                if (valSpan) {
                    if (id === 'iconScale') {
                        valSpan.textContent = input.value;
                    } else if (id === 'tooltipDuration') {
                        valSpan.textContent = input.value + "s";
                    } else if (id === 'forecastDays') {
                        valSpan.textContent = input.value + "days";
                    } else {
                        valSpan.textContent = input.value + "px";
                    }
                }
            };
        }
    });
    // initViewSettings サブルーチンの最後の方に追加
    const windUnitInput = document.getElementById('input-windUnit');
    if (windUnitInput) {
        windUnitInput.addEventListener('change', () => {
            const thresholdUnitSpan = document.getElementById('val-windThresholds');
            if (thresholdUnitSpan) {
                thresholdUnitSpan.textContent = `(${windUnitInput.options[windUnitInput.selectedIndex].text})`;
            }
        });
    }
}

/**
 * 内部サブルーチン：現在の viewConfig の値をスライダーとラベルに反映させる
 */
function syncSliderValues() {
    // 1. 各種 ID リスト
    const configIds = [
        'hourWidth', 'windHeight', 'subHeight', 'margin', 'fontSize', 
        'iconScale', 'tooltipDuration', 'forecastDays', 'tempUnit', 'windUnit',
        'windThresholdHigh', 'windThresholdMid', 'windThresholdLow'
    ];

    // 2. 風速単位の表示を先に同期する
    const windUnitInput = document.getElementById('input-windUnit');
    if (windUnitInput) {
        // viewConfig に保存されている単位をセレクトボックスにセット
        windUnitInput.value = viewConfig.windSpeedUnit;
        
        // 選択された単位のテキスト（例: "kn (ノット)"）を取得してしきい値ラベルに反映
        const thresholdUnitSpan = document.getElementById('val-windThresholds');
        if (thresholdUnitSpan) {
            const unitText = windUnitInput.options[windUnitInput.selectedIndex].text;
            thresholdUnitSpan.textContent = `(${unitText})`;
        }
    }

    // 3. 全ての値を入力欄に反映
    configIds.forEach(id => {
        let configKey = id;
        if (id === 'margin') configKey = 'graphMargin';
        if (id === 'tempUnit') configKey = 'temperatureUnit';
        if (id === 'windUnit') configKey = 'windSpeedUnit';

        let val = viewConfig[configKey];
        if (id === 'forecastDays' && val === undefined) val = 9;

        const input = document.getElementById(`input-${id}`);
        if (input) {
            input.value = val;
        }
        
        // 数値表示ラベル（スライダー横）の更新
        const valSpan = document.getElementById(`val-${id}`);
        if (valSpan) {
            if (id === 'iconScale') {
                valSpan.textContent = val;
            } else if (id === 'tooltipDuration') {
                valSpan.textContent = val + "s";
            } else if (id === 'forecastDays') {
                valSpan.textContent = val + "days";
            } else {
                valSpan.textContent = val + "px";
            }
        }
    });
}

/**
 * サブルーチン：設定の保存と適用
 * localStorageに書き込み、ページをリロードして定数を再定義させる。
 */
async function saveViewSettings() {
    // 1. UIから値を取得して viewConfig を更新
    viewConfig.forecastDays = parseInt(document.getElementById('input-forecastDays').value);
    viewConfig.hourWidth = parseInt(document.getElementById('input-hourWidth').value);
    viewConfig.windHeight = parseInt(document.getElementById('input-windHeight').value);
    viewConfig.subHeight = parseInt(document.getElementById('input-subHeight').value);
    viewConfig.graphMargin = parseInt(document.getElementById('input-margin').value);
    viewConfig.fontSize = parseInt(document.getElementById('input-fontSize').value);
    viewConfig.iconScale = parseFloat(document.getElementById('input-iconScale').value);
    viewConfig.tooltipDuration = parseInt(document.getElementById('input-tooltipDuration').value);
    
    // 温度単位と風速単位を取得
    viewConfig.temperatureUnit = document.getElementById('input-tempUnit').value;
    viewConfig.windSpeedUnit = document.getElementById('input-windUnit').value;

    // 【追加】風速色付け閾値を取得（input type="number" から取得）
    viewConfig.windThresholdHigh = parseFloat(document.getElementById('input-windThresholdHigh').value);
    viewConfig.windThresholdMid = parseFloat(document.getElementById('input-windThresholdMid').value);
    viewConfig.windThresholdLow = parseFloat(document.getElementById('input-windThresholdLow').value);

    // 2. 【重要】地点データが空（操作不能リスク）の状態かチェック
    const savedSpots = localStorage.getItem('pin_weather_spots');
    let hasSpots = false;
    try {
        const parsed = JSON.parse(savedSpots);
        if (parsed && parsed.length > 0) hasSpots = true;
    } catch(e) { hasSpots = false; }

    // 地点がない場合は、リロード前に現在地を特定・保存して「真っ白」を防ぐ
    if (!hasSpots) {
        console.log("No spots found during save. Fetching approximate location...");
        await setApproximateLocation(); // 既存のIP Geolocation関数を利用
        // 推定された地点を保存
        const newSpot = { label: currentLabel, lat: currentLat, lon: currentLon };
        localStorage.setItem('pin_weather_spots', JSON.stringify([newSpot]));
    }

    // 3. 表示設定を保存（JSON形式）
    // 保存キー名はご提示いただいた現状のコード（pin_weather_view_config）を厳守
    localStorage.setItem('pin_weather_view_config', JSON.stringify(viewConfig));

    // 4. 完了通知なしでリロード
    location.reload();
}

/**
 * サブルーチン：設定のリセット処理
 * 定義済みの defaultViewConfig を使用して設定を初期化する
 */
function resetViewSettings() {
    // 汎用ダイアログを呼び出し
    showAppDialog({
        title: i18n.t('btnResetAll'), // タイトル
        messageKey: 'confirmReset',    // メッセージ
        onSave: () => {
            // 「保存（実行）」ボタンが押された時の処理
            // 深いコピーを行い、localStorage のキー名を「pin_weather_view_config」に統一
            const resetData = JSON.parse(JSON.stringify(defaultViewConfig));
            localStorage.setItem('pin_weather_view_config', JSON.stringify(resetData));
            location.reload();
        }
    });
}


/**
 * サブルーチン：QRコード生成
 */
function generateSidebarQRCode() {
    const qrContainer = document.getElementById('sidebar-qrcode');
    if (!qrContainer) return;

    qrContainer.innerHTML = "";

    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
    script.onload = () => {
        new QRCode(qrContainer, {
            text: window.location.href,
            width: 120,
            height: 120,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    };
    document.head.appendChild(script);
}

/**
 * サブルーチン：現在のURLをクリップボードにコピーする
 */
function initCopyUrlEvent() {
    const copyBtn = document.getElementById('copy-url-btn');
    if (!copyBtn) return;

    copyBtn.onclick = async () => {
        const originalText = copyBtn.innerText;
        const originalBg = copyBtn.style.backgroundColor || "#e3f2fd";

        try {
            await navigator.clipboard.writeText(window.location.href);
            
            // 成功時：緑系に変化
            copyBtn.innerText = i18n.t('copySuccess');
            copyBtn.style.backgroundColor = "#c8e6c9";
            
        } catch (err) {
            // 失敗時：alert を廃止し、ボタンを赤系に変化させて通知
            copyBtn.innerText = i18n.t('copyError');
            copyBtn.style.backgroundColor = "#ffcdd2"; // 薄い赤
            console.error("Copy failed:", err);
        }

        // 2秒後に元の状態に戻す（成功・失敗共通）
        setTimeout(() => {
            copyBtn.innerText = originalText;
            copyBtn.style.backgroundColor = originalBg;
        }, 2000);
    };
}
/**
 * サブルーチン：環境判定とUIへの反映
 * index.htmlの構造に合わせてセレクタを修正
 */
function applyEnvVisuals() {
    const hostname = window.location.hostname;
    let config = {};

    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.includes("192.168.")) {
        config = {
            titleSuffix: " [Local]",
            headerColor: "#b0fbcf", 
            envName: "PC Localhost"
        };
    } else if (hostname.includes("beta")) {
        config = {
            titleSuffix: " (B)",
            headerColor: "#f5dc1b", 
            envName: "Beta版"
        };
    } else {
        config = {
            titleSuffix: "",
            headerColor: "#00c8ff", 
            envName: "Main版"
        };
    }

    // 2. ヘッダー（control-wrapper）背景色の反映
    const headerEl = document.querySelector('.control-wrapper');
    if (headerEl) {
        headerEl.style.backgroundColor = config.headerColor;
        headerEl.style.transition = "background-color 0.3s ease";
    }

    // 3. フッター（footer-info）の下に環境名を表示
    const footerDisclaimer = document.querySelector('.footer-info');
    if (footerDisclaimer) {
        const oldBadge = document.getElementById('footer-env-badge');
        if (oldBadge) oldBadge.remove();

        const badge = document.createElement('div');
        badge.id = 'footer-env-badge';
        badge.style.marginTop = "8px";
        badge.style.fontSize = "10px";
        badge.style.color = "#888";
        badge.style.textAlign = "center";
        badge.innerText = `Running on: ${config.envName}`;
        
        footerDisclaimer.appendChild(badge);
    }

    if (!document.title.includes(config.titleSuffix)) {
        document.title += config.titleSuffix;
    }
}

/**
 * サブルーチン：アプリ起動時の初期化
 * 1. 保存データがあればロード
 * 2. データがない場合はIPから現在地を推定して即時描画
 * 3. WelcomeダイアログでGPS/Mapの選択を促す
 */
async function initApp() {
    // 【追加】まず最初にドメイン移行が必要かチェックする
    checkDomainMigration();

    window.history.replaceState({ page: 'home' }, "");

    const savedData = localStorage.getItem('pin_weather_spots');
    let parsedData = null;
    try {
        if (savedData) parsedData = JSON.parse(savedData);
    } catch (e) {
        parsedData = null;
    }

    if (parsedData && parsedData.length > 0) {
        mySpots = parsedData;
        const lastSpot = mySpots[0];
        currentLat = lastSpot.lat;
        currentLon = lastSpot.lon;
        currentLabel = lastSpot.label;
        finalizeInit(); 
    } else {
        mySpots = [];
        // IP推定（おおよその位置）が完了するまで待機（真っ白回避）
        await setApproximateLocation(); 
        
        // 推定地点（失敗時はサンプル）で背景を先に描画
        finalizeInit();

        // Welcomeダイアログ表示
        setTimeout(() => {
            if (typeof showAppDialog === 'function') {
                showAppDialog({
                    title: "Welcome",
                    messageKey: 'welcomeGuide',
                    onMap: () => openMap(currentLat, currentLon), // 推定位置を初期値にする
                    onSave: () => handleGPSClick() 
                });
                setupWelcomeButtons();
            }
        }, 500);

        // バックグラウンドGPSは「座標の更新」のみ。renderTabsは呼ばない。
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    currentLat = pos.coords.latitude;
                    currentLon = pos.coords.longitude;
                },
                null,
                { timeout: 8000 }
            );
        }
    }
}

/**
 * サブルーチン：IP Geolocationによる市区町村レベルの推定
 */
async function setApproximateLocation() {
    try {
        // 無料のIP Geolocation API (ipapi.co) を利用
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) throw new Error('API Network Error');
        
        const data = await response.json();
        
        if (data.latitude && data.longitude) {
            currentLat = data.latitude;
            currentLon = data.longitude;
            // 市町村名(city)を優先、なければ県名(region)、それもなければ「現在地」
            const locName = data.city || data.region || "現在地";
            currentLabel = `${locName}(Approx)`;
        } else {
            throw new Error('Data Incomplete');
        }
    } catch (error) {
        console.warn("Approximate location failed. Falling back to default sample.", error);
        // 最終的なバックアップ（高須沖）
        currentLat = 31.337; 
        currentLon = 130.795;
        currentLabel = "高須沖(Sample)";
    }
}

/**
 * サブルーチン：Welcomeダイアログのボタン外観調整
 */
function setupWelcomeButtons() {
    const footer = document.getElementById('common-modal-footer');
    if (!footer) return;
    const buttons = footer.getElementsByTagName('button');
    for (let btn of buttons) {
        // 「適用/保存」ボタンのクラス（btn-save）を探してGPSに書き換え
        if (btn.classList.contains('btn-save')) {
            btn.innerText = "GPS";
        }
        // 「閉じる/キャンセル」ボタン（btn-secondary）を非表示にする
        if (btn.classList.contains('btn-secondary')) {
            btn.style.display = 'none';
        }
    }
}

/**
 * サブルーチン：共通の初期化プロセス
 */
function finalizeInit() {
    initViewSettings();
    initCopyUrlEvent();
    applyEnvVisuals(); 
    renderTabs();
    initCompassUI();
    updateLocation(currentLat, currentLon, currentLabel);
    generateSidebarQRCode();
    setupGeneralEvents(); // UIイベント登録
}

/**
 * サブルーチン：UIイベントの登録
 * 画面上の各ボタンや入力欄に、クリック等の動作（イベント）を紐付ける。
 */
function setupGeneralEvents() {
    // 1. 地図検索入力欄（Enterキーで検索実行）
    const searchInput = document.getElementById('map-search-input');
    if (searchInput) {
        searchInput.onkeypress = (e) => {
            if (e.key === 'Enter') executeMapSearch();
        };
    }
    
    // 2. 地図検索ボタン
    const searchBtn = document.getElementById('map-search-btn');
    if (searchBtn) searchBtn.onclick = executeMapSearch;
    
    // 3. 風向色付設定ボタン（サイドバー内）
    // 競合回避のため、toggleSidebar を介さず openModalFromSidebar を使用
    const windCfgBtn = document.getElementById('wind-cfg-btn');
    if (windCfgBtn) {
        windCfgBtn.onclick = () => {
            if (typeof openModalFromSidebar === 'function') {
                openModalFromSidebar('wind-modal');
            } else {
                // 万が一関数がない場合のフォールバック（動作安定のため）
                toggleSidebar();
                openModal('wind-modal');
            }
        };
    }
    
    // 4. 風向設定の適用ボタン（モーダル内）
    const applyWindBtn = document.getElementById('apply-wind-btn');
    if (applyWindBtn) {
        applyWindBtn.onclick = () => {
            localStorage.setItem('pin_weather_wind_filter', JSON.stringify(targetWindDirections));
            closeModal('wind-modal');
            draw(); // グラフを再描画
        };
    }

    // 5. GPSボタン
    const gpsBtn = document.getElementById('gps-btn');
    if (gpsBtn) gpsBtn.onclick = () => handleGPSClick();
    
    // 6. Mapボタン
    const mapBtn = document.getElementById('map-btn');
    if (mapBtn) {
        mapBtn.onclick = () => { 
            openMap(); 
            renderTabs("Map"); 
        };
    }

    // 7. 【追加】ご意見・ご要望ボタン（サイドバー内）
    const feedbackBtn = document.getElementById('feedback-btn');
    if (feedbackBtn) {
        feedbackBtn.onclick = () => {
            const formUrl = "https://forms.gle/zdbaJNdodCMzcftK6";
            window.open(formUrl, '_blank');
        };
    }

    // 8. プライバシーポリシーのリンク
    const privacyLink = document.getElementById('privacy-link');
    if (privacyLink) {
        privacyLink.onclick = (e) => {
            e.preventDefault(); // 画面遷移を防ぐ
            const privacyUrl = "./privacy.html";
            window.open(privacyUrl, '_blank');
        };
    }
}

/**
 * サイドバーの開閉制御
 * 戻るボタン対策と、表示状態の不整合を修正した完全版
 */
function toggleSidebar() {
    const sb = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (!sb || !overlay) return;

    // style.display と classList の不整合を防ぐため、実際の表示状態で判定
    const isOpen = sb.classList.contains('open') && sb.style.display !== 'none';

    if (isOpen) {
        // --- 閉じる処理 ---
        sb.classList.remove('open');
        sb.style.display = 'none'; // 明示的に非表示
        overlay.style.display = 'none';

        // 手動で閉じた場合、積んだ履歴を1つ戻す
        if (window.history.state && window.history.state.page === 'sidebar') {
            window.history.back();
        }
    } else {
        // --- 開く処理 ---
        sb.classList.add('open');
        sb.style.display = 'block'; // 明示的に表示
        overlay.style.display = 'block';

        // 履歴に状態を追加（これで戻るボタンでアプリが終了しなくなる）
        window.history.pushState({ page: 'sidebar' }, "");
    }
}

/**
 * サイドバー内のボタンからモーダルを呼び出す専用関数
 * 戻るボタンの競合（一瞬で消える現象）を防ぐための完全版
 */
function openModalFromSidebar(modalId) {
    const sb = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const modal = document.getElementById(modalId);

    if (!sb || !modal) return;

    // 1. サイドバーを閉じる（履歴を戻さずに直接非表示にする）
    sb.classList.remove('open');
    sb.style.display = 'none';
    if (overlay) overlay.style.display = 'none';

    // 2. サイドバー用に積んでいた履歴を「モーダル用」として再利用（上書き）
    // これにより popstate が発火せず、一瞬で消える現象を回避する
    window.history.replaceState({ page: 'modal', id: modalId }, "");

    // 3. モーダルを表示
    modal.style.display = 'block';

    // 風向設定モーダルの場合はUIを初期化
    if (modalId === 'wind-modal') {
        initCompassUI();
    }
}

function initCompassUI() {
    const container = document.getElementById('compass-ui');
    if (!container) return;
    const radius = 130; 
    const centerX = 160; 
    const centerY = 160;

    // 中央のテキストを辞書から取得するように変更
    const centerText = i18n._currentLang === 'ja' ? "全選択<br>解除" : "ALL";
    container.innerHTML = `<div class="compass-center">${centerText}</div>`;

    windDirs.forEach((dir, i) => {
        const angle = (i * 22.5 - 90) * (Math.PI / 180);
        const x = centerX + radius * Math.cos(angle) - 30;
        const y = centerY + radius * Math.sin(angle) - 15;

        const el = document.createElement('div');
        el.className = 'compass-label' + (targetWindDirections.includes(dir) ? ' active' : '');
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.innerText = dir;
        
        el.onclick = () => {
            if (targetWindDirections.includes(dir)) {
                targetWindDirections = targetWindDirections.filter(d => d !== dir);
                el.classList.remove('active');
            } else {
                targetWindDirections.push(dir);
                el.classList.add('active');
            }
        };
        container.appendChild(el);
    });

    const center = container.querySelector('.compass-center');
    if (center) {
        center.onclick = () => {
            const labels = container.querySelectorAll('.compass-label');
            if (targetWindDirections.length > 0) {
                targetWindDirections = [];
                labels.forEach(l => l.classList.remove('active'));
            } else {
                targetWindDirections = [...windDirs];
                labels.forEach(l => l.classList.add('active'));
            }
        };
    }
}

/**
 * サブルーチン：環境色を反映した汎用ダイアログを表示（多言語・サイズ調整版）
 */
function showAppDialog({ title, messageKey, inputValue = null, onMap = null, onSave = null, onDelete = null }) {
    const modal = document.getElementById('app-common-modal');
    const header = document.getElementById('common-modal-header');
    const titleEl = document.getElementById('common-modal-title');
    const msgEl = document.getElementById('common-modal-message');
    const inputArea = document.getElementById('common-modal-input-area');
    const input = document.getElementById('common-modal-input');
    const footer = document.getElementById('common-modal-footer');

    // 1. 環境色の厳密な一致（applyEnvVisualsのロジックを流用）
    const hostname = window.location.hostname;
    let bgColor = "#007bff"; // Main (Blue)
    let textColor = "#ffffff";

    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.includes("192.168.")) {
        bgColor = "#b0fbcf"; // Local (Greenish)
        textColor = "#333333";
    } else if (hostname.includes("beta")) {
        bgColor = "#f5dc1b"; // Beta (Yellow)
        textColor = "#333333";
    }

    header.style.backgroundColor = bgColor;
    titleEl.style.color = textColor;

    // 2. コンテンツのセット（多言語化対応）
    titleEl.innerText = title;
    // メッセージキーがあれば翻訳、なければ空
    msgEl.innerText = messageKey ? i18n.t(messageKey) : "";
    
    if (inputValue !== null) {
        inputArea.style.display = 'block';
        input.value = inputValue;
    } else {
        inputArea.style.display = 'none';
    }

    // 3. ボタンの生成
    footer.innerHTML = "";
    
    // 削除ボタン
    if (onDelete) {
        const btnDelete = document.createElement('button');
        btnDelete.className = "btn btn-danger-outline";
        btnDelete.innerText = i18n.t('btnDelete'); 
        
        btnDelete.onclick = () => {
            onDelete();
            modal.style.display = 'none';
        };
        footer.appendChild(btnDelete);
    }

    // 地図ボタン（新規追加）
    if (onMap) {
        const btnMap = document.createElement('button');
        btnMap.className = "btn btn-map-view"; // 既存の地図ボタン用クラスを流用
        btnMap.innerText = "Map"; 
        btnMap.onclick = () => {
            onMap();
            modal.style.display = 'none';
        };
        footer.appendChild(btnMap);
    }

    // キャンセルボタン
    const btnCancel = document.createElement('button');
    btnCancel.className = "btn btn-secondary";
    btnCancel.innerText = i18n.t('btnClose');
    btnCancel.onclick = () => modal.style.display = 'none';
    footer.appendChild(btnCancel);

    // 保存ボタン
    if (onSave) {
        const btnSave = document.createElement('button');
        btnSave.className = "btn btn-save";
        btnSave.innerText = i18n.t('btnApply') || i18n.t('btnSaveSettings');
        btnSave.onclick = () => {
            onSave(input.value);
            modal.style.display = 'none';
        };
        footer.appendChild(btnSave);
    }

    modal.style.display = 'flex';
}

/**
 * サブルーチン：地点登録数の制限チェック
 * @param {string} newName - 新しく登録しようとしている地点名
 * @returns {boolean} - 登録可能な場合は true
 */
/**
 * サブルーチン：地点登録数の制限チェック
 */
function checkSpotLimit(newName) {
    const alreadyExists = mySpots.some(s => s.label === newName);
    if (alreadyExists) return true;

    if (mySpots.length >= 10) {
        // 入力モーダルを閉じる時間を稼いでからエラーを表示
        setTimeout(() => {
            showAppDialog({
                title: i18n.t('limitReachedTitle') || "Limit",
                messageKey: 'limitReached',
                // ボタンなし（OKで閉じるだけ）の設定
            });
        }, 100); 
        return false;
    }
    return true;
}

/**
 * サブルーチン：地点タブの描画
 * 並び順：[1]表示中地点 [2]GPS固定 [3]Map固定 [4...]履歴
 */
function renderTabs(activeOverrideLabel = null) {
    const container = document.getElementById('spot-tabs');
    if (!container) return;
    container.innerHTML = "";

    // 10個制限
    if (mySpots.length > 10) {
        mySpots = mySpots.slice(0, 10);
        localStorage.setItem('pin_weather_spots', JSON.stringify(mySpots));
    }

    const activeLabel = activeOverrideLabel || currentLabel;
    const activeIdx = mySpots.findIndex(s => s.label === activeLabel);
    let displaySpots = [...mySpots];
    let activeSpot = null;
    let isExternalSpot = false;

    // [1] アクティブ地点（1番目）の抽出
    if (activeIdx > -1) {
        activeSpot = displaySpots.splice(activeIdx, 1)[0];
    } else if (activeLabel && !['gps', 'map', 'GPS', 'Map'].includes(activeLabel)) {
        isExternalSpot = true;
        activeSpot = { label: activeLabel, lat: currentLat, lon: currentLon };
    }

    let items = [];
    if (activeSpot) {
        items.push({ id: activeSpot.label, label: isExternalSpot ? activeSpot.label : `📍 ${activeSpot.label}`, lat: activeSpot.lat, lon: activeSpot.lon, rawLabel: activeSpot.label, isExternal: false });
    }
    // [2][3] 固定ボタン
    items.push({ id: 'gps', label: 'GPS', isSpecial: true, isExternal: true });
    items.push({ id: 'map', label: 'Map', isSpecial: true, isExternal: true });
    // [4以降] 履歴
    displaySpots.forEach(s => items.push({ id: s.label, label: `📍 ${s.label}`, lat: s.lat, lon: s.lon, rawLabel: s.label, isExternal: false }));

    items.forEach((item) => {
        const btn = document.createElement('button');
        const isSelected = (item.id === activeLabel || item.label === activeLabel || item.rawLabel === activeLabel);
        btn.className = 'btn' + (item.id === 'gps' ? ' btn-gps' : item.id === 'map' ? ' btn-map-view' : ' btn-location');
        
        if (isSelected) {
            btn.classList.add('active');
            setTimeout(() => {
                if (btn.classList.contains('active')) {
                    btn.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
                }
            }, 150);
        }
        btn.innerText = item.label;

        btn.onclick = (e) => {
            if (e) e.stopPropagation();
            if (item.id === 'gps') {
                handleGPSClick();
            } else if (item.id === 'map') {
                // 設計通り、現在の位置を渡して地図を開く。ラベルの勝手な書き換えはしない。
                openMap(currentLat, currentLon); 
            } else {
                if (!item.isExternal) {
                    const idx = mySpots.findIndex(s => s.label === item.rawLabel);
                    if (idx > -1) {
                        const selectedSpot = mySpots.splice(idx, 1)[0];
                        mySpots.unshift(selectedSpot);
                        localStorage.setItem('pin_weather_spots', JSON.stringify(mySpots));
                    }
                }
                updateLocation(item.lat, item.lon, item.rawLabel);
                renderTabs(item.rawLabel); 
            }
        };

        // 編集・削除（長押し・右クリック）ロジックの直接記述
        if (!item.isSpecial) {
            const spotIdx = mySpots.findIndex(s => s.label === item.rawLabel);
            const openEditor = (e) => {
                if (e) { e.preventDefault(); e.stopPropagation(); }
                if (typeof showAppDialog === 'function') {
                    showAppDialog({
                        title: item.rawLabel,
                        messageKey: 'editSpotGuide',
                        inputValue: item.rawLabel,
                        onMap: () => { if (typeof openMap === 'function') openMap(item.lat, item.lon); },
                        onSave: (newName) => {
                            if (!newName || (typeof checkSpotLimit === 'function' && !checkSpotLimit(newName))) return;
                            if (spotIdx !== -1) {
                                const targetSpot = mySpots.splice(spotIdx, 1)[0];
                                targetSpot.label = newName;
                                mySpots.unshift(targetSpot);
                            } else {
                                const filtered = mySpots.filter(s => s.label !== newName);
                                mySpots = [{ lat: item.lat, lon: item.lon, label: newName }, ...filtered];
                            }
                            localStorage.setItem('pin_weather_spots', JSON.stringify(mySpots));
                            updateLocation(item.lat, item.lon, newName);
                            renderTabs(newName);
                        },
                        onDelete: spotIdx !== -1 ? () => {
                            mySpots.splice(spotIdx, 1);
                            localStorage.setItem('pin_weather_spots', JSON.stringify(mySpots));
                            renderTabs();
                        } : null 
                    });
                }
            };
            btn.oncontextmenu = openEditor; // 右クリック
            let timer;
            btn.ontouchstart = (e) => { timer = setTimeout(() => openEditor(e), 800); }; // 長押し開始
            btn.ontouchend = () => clearTimeout(timer); // 解除
        }
        container.appendChild(btn);
    });
}

/**
 * サブルーチン：地点の削除確認（自作ダイアログ版）
 * @param {number} index - 削除対象の mySpots インデックス
 */
function confirmDelete(index) {
    if (index === -1 || !mySpots[index]) return;

    const targetLabel = mySpots[index].label;

    showAppDialog({
        title: targetLabel,
        messageKey: 'editSpotGuide', // または削除専用のキー
        onDelete: () => {
            // 自作ダイアログ内の「削除」ボタンが押された時の実処理
            mySpots.splice(index, 1);
            localStorage.setItem('pin_weather_spots', JSON.stringify(mySpots));
            renderTabs();
        }
    });
}

const resetBtn = document.getElementById('reset-all-btn');
if (resetBtn) {
    resetBtn.onclick = () => {
        // 自作ダイアログを表示
        showAppDialog({
            title: i18n.t('btnResetAll'), // 大きなタイトル
            messageKey: 'confirmInit',    // 小さなメッセージ（「全て初期化しますか？」等）
            onSave: () => {
                // 「はい/実行」が押された時の実処理をここに集約
                toggleSidebar();
                
                // 地点データの初期化
                mySpots = JSON.parse(JSON.stringify(defaultSpots));
                localStorage.setItem('pin_weather_spots', JSON.stringify(mySpots));
                
                // 風向フィルタの初期化
                targetWindDirections = [...windDirs];
                localStorage.setItem('pin_weather_wind_filter', JSON.stringify(targetWindDirections));
                
                // 画面表示の更新
                updateLocation(mySpots[0].lat, mySpots[0].lon, mySpots[0].label);
            }
        });
    };
}




/**
 * サブルーチン：GPSボタンクリック時の処理
 * 現在地を取得し、逆引きAPIで地名を取得してからupdateLocationを呼び出す。
 */
function handleGPSClick() {
    if ("geolocation" in navigator) {
        const gpsBtn = document.querySelector('.btn-gps');
        if (gpsBtn) gpsBtn.innerText = i18n.t('gpsFetching');

        navigator.geolocation.getCurrentPosition(async (pos) => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            let gpsLabel = i18n.t('gpsDefaultLabel');

            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=${i18n._currentLang}`);
                const data = await res.json();
                const addr = data.address;
                const city = addr.city || addr.town || addr.village || "";
                const district = addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || "";
                if (city || district) {
                    gpsLabel = (city + district) + "(GPS)";
                }
            } catch (err) { console.error(err); }

            if (gpsBtn) gpsBtn.innerText = "GPS";

            // グローバル変数の同期（タブ描画の基準となる値を確定させる）
            currentLat = lat;
            currentLon = lon;
            currentLabel = gpsLabel;

            // グラフの更新
            updateLocation(lat, lon, gpsLabel);

            // 【重要】左端のタブ（1番目ボタン）を、新たに取得したgpsLabelで再描画する
            renderTabs(gpsLabel);

        }, (err) => {
            // エラー時の処理
            console.error(err);
            if (gpsBtn) gpsBtn.innerText = "GPS";
            
            // alert を廃止し、自作ダイアログを表示
            showAppDialog({
                title: "GPS Error", 
                messageKey: 'gpsError' 
            });
        });
    }
}

const addBtn = document.getElementById('add-btn');
if (addBtn) addBtn.onclick = () => openMap();

/**
 * サブルーチン：地図モーダルを開く
 */
function openMap() {
    // 検索入力欄のクリア
    const searchInput = document.getElementById('map-search-input');
    if (searchInput) searchInput.value = '';

    // 【重要】共通サブルーチンでモーダルを開く（履歴が積まれる）
    openModal('map-modal');

    // --- 以下、地図の描画・更新ロジック ---
    if (!map) {
        // 初回のみ地図オブジェクトを作成
        const esri = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', { attribution: 'Esri' });
        const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: 'Esri' });
        const gsi = L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png', { attribution: '&copy; 国土地理院' });
        
        map = L.map('map-canvas', { center: [currentLat, currentLon], zoom: 14, layers: [esri] });
        
        const baseMaps = {};
        baseMaps[i18n.t('layerStreet')] = esri;
        baseMaps[i18n.t('layerSatellite')] = satellite;
        baseMaps[i18n.t('layerGSI')] = gsi;
        
        L.control.layers(baseMaps).addTo(map);
        map.on('click', onMapClick);
    } else {
        // 二回目以降は表示位置を更新
        map.setView([currentLat, currentLon], 14);
    }

    // 住所情報の取得とマーカーの再設置
    fetchAddressInfo(currentLat, currentLon);
    if (tempMarker) map.removeLayer(tempMarker);
    tempMarker = L.marker([currentLat, currentLon]).addTo(map);

    // モーダル表示後のサイズ崩れ対策
    setTimeout(() => {
        if (map) map.invalidateSize();
    }, 300);
}

// ① 起動時の基点設定（一度だけ）
console.log("DEBUG: App Init - Setting Home State");
window.history.replaceState({ page: 'home' }, "");

/**
 * 監視役：ブラウザの「戻る」が押されたら実行（一本化）
 */
window.onpopstate = function(event) {
    console.log("DEBUG: Back Button Pressed!", event.state);

    // 全ての要素を確実に非表示にし、クラスも除去する
    const targets = document.querySelectorAll('.modal, .modal-overlay, #app-common-modal, .sidebar, .sidebar-overlay');
    targets.forEach(m => {
        m.style.display = 'none';
        if (m.classList.contains('open')) {
            m.classList.remove('open');
        }
    });
    
    // 地図の仮マーカー消去
    if (typeof tempMarker !== 'undefined' && tempMarker && map) {
        map.removeLayer(tempMarker);
    }
};

/**
 * 共通サブルーチン：モーダルを開く
 * 履歴を積むことで、ブラウザの「戻る」ボタンで閉じられるように制御する
 */
function openModal(id) {
    const modal = document.getElementById(id);
    
    // モーダルが存在しない、または既に表示されている場合は何もしない
    if (!modal || modal.style.display === 'block') return;
    
    // 表示状態に変更
    modal.style.display = 'block';
    
    // 履歴に状態を追加（戻るボタンでアプリが終了するのを防ぐ）
    window.history.pushState({ page: 'modal', id: id }, "");
    
    console.log("DEBUG: Modal Opened:", id);
}

/**
 * 共通サブルーチン：モーダルを閉じる
 */
function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal && modal.style.display === 'block') {
        modal.style.display = 'none';
        
        if (window.history.state && window.history.state.page === 'modal') {
            window.history.back();
        }
    }
}

/**
 * 共通サブルーチン：サイドバーを開く際に履歴を積む
 * サイドバーを表示させる関数（既存）の直後に追加して使用してください。
 */
function pushSidebarState() {
    window.history.pushState({ page: 'sidebar' }, "");
    console.log("DEBUG: Sidebar State Pushed");
}

// 設定保存時に実行
function applyStylesToCSS() {
    const root = document.documentElement;
    root.style.setProperty('--graph-margin', `${viewConfig.graphMargin}px`);
    root.style.setProperty('--label-font-size', `${viewConfig.fontSize}px`);
}

async function executeMapSearch() {
    const input = document.getElementById('map-search-input');
    if (!input) return;
    const query = input.value;
    if (!query) return;
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&accept-language=ja`);
        const results = await res.json();
        if (results.length > 0) {
            const { lat, lon } = results[0];
            const latlng = [parseFloat(lat), parseFloat(lon)];
            map.setView(latlng, 15);
            if (tempMarker) map.removeLayer(tempMarker);
            tempMarker = L.marker(latlng).addTo(map);
            fetchAddressInfo(parseFloat(lat), parseFloat(lon));
        }
    } catch (err) { console.error(err); }
}

async function onMapClick(e) {
    const { lat, lng } = e.latlng;
    if (tempMarker) map.removeLayer(tempMarker);
    tempMarker = L.marker([lat, lng]).addTo(map);
    await fetchAddressInfo(lat, lng);
}

/**
 * サブルーチン：地図モーダル内での住所情報取得とボタン設定
 */
async function fetchAddressInfo(lat, lng) {
    const statusEl = document.getElementById('map-status');
    if (statusEl) statusEl.innerText = i18n.t('mapStatusFetching');
    
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=${i18n._currentLang}`);
        const data = await res.json();
        const addr = data.address;
        const city = addr.city || addr.town || addr.village || "";
        const district = addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || "";
        const defaultName = (city + district) || i18n.t('mapNewSpot');

        const tempViewBtn = document.getElementById('temp-view-btn');
        if (tempViewBtn) {
            tempViewBtn.onclick = () => {
                const suffix = i18n._currentLang === 'ja' ? "(未登録)" : "(Temp)";
                updateLocation(lat, lng, defaultName + suffix);
                closeModal('map-modal');
            };
            tempViewBtn.disabled = false;
        }

        const saveSpotBtn = document.getElementById('save-spot-btn');
        if (saveSpotBtn) {
            saveSpotBtn.onclick = () => {
                showAppDialog({
                    title: defaultName,
                    messageKey: 'mapSavePrompt',
                    inputValue: defaultName,
                    // fetchAddressInfo 内の地図からの保存処理
                    onSave: (spotName) => {
                        if (!spotName) return;

                        // サブルーチンでチェック
                        if (!checkSpotLimit(spotName)) return;

                        const filtered = mySpots.filter(s => s.label !== spotName);
                        mySpots = [{ lat, lon: lng, label: spotName }, ...filtered];
                        
                        localStorage.setItem('pin_weather_spots', JSON.stringify(mySpots));
                        updateLocation(lat, lng, spotName);
                        renderTabs(spotName);
                        closeModal('map-modal');
                    }
                });
            };
            saveSpotBtn.disabled = false;
        }
        
        if (statusEl) statusEl.innerText = "📍：" + defaultName;
    } catch (err) {
        if (statusEl) statusEl.innerText = i18n.t('mapStatusFail');
    }
}

async function updateLocation(lat, lon, label) {
    const timerLabel = `📊 描画所要時間 [${label}]`;    
    console.time(timerLabel);
    currentLat = lat; 
    currentLon = lon; 
    currentLabel = label;
    try {
        // 実際の描画処理
        await draw(); 
    } catch (err) {
        console.error(`描画エラー [${label}]:`, err);
    } finally {
        // 計測終了（コンソールに "📊 描画所要時間 [地点名]: 123.456ms" と表示される）
        console.timeEnd(timerLabel);
    }
}


const weatherIcons = { 0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️", 45: "🌫️", 48: "🌫️", 51: "🌦️", 53: "🌦️", 55: "🌦️", 61: "🌧️", 63: "🌧️", 65: "🌧️", 71: "❄️", 73: "❄️", 75: "❄️", 80: "🌦️", 81: "🌦️", 82: "🌦️", 95: "⛈️" };
function getWindDirText(deg) { return windDirs[Math.round(deg / 22.5) % 16]; }

/**
 * サブルーチン：キャッシュ付きデータ取得
 * 効率的なキャッシュ管理とエラーハンドリングを両立
 */
async function fetchWithCache(lat, lon) {
    const cacheKey = `weather_cache_${lat.toFixed(3)}_${lon.toFixed(3)}`;
    const cached = localStorage.getItem(cacheKey);
    const now = Date.now();

    // 予報日数を設定から取得（未定義ならデフォルト9日）
    const fDays = viewConfig.forecastDays || 9;
    // 温度・風速単位を設定から取得
    const tUnit = viewConfig.temperatureUnit || 'celsius';
    const wUnit = viewConfig.windSpeedUnit || 'ms';

    const navEntries = performance.getEntriesByType('navigation');
    const isReload = navEntries.length > 0 && navEntries[0].type === 'reload';

    if (cached) {
        try {
            const parsed = JSON.parse(cached);
            
            // 【重要】期限内かつリロードでなく、かつキャッシュされているデータの日数・単位が現在の設定と同じであればキャッシュを返す
            // ※日数や単位が変更された場合は、強制的に再取得させる必要があるため
            if (!isReload && 
                (now - parsed.timestamp < CACHE_DURATION) && 
                (parsed.data && parsed.data.time && parsed.data.time.length === fDays * 24) &&
                parsed.tUnit === tUnit &&
                parsed.wUnit === wUnit) {
                return { timestamp: parsed.timestamp, data: parsed.data };
            } else {
                // 期限切れ、リロード、または設定（日数・単位）変更ならキャッシュを消去
                localStorage.removeItem(cacheKey);
            }
        } catch (e) {
            localStorage.removeItem(cacheKey);
        }
    }

    // API取得（forecast_days, temperature_unit, wind_speed_unit を動的に設定）
    const wUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,wind_speed_10m,wind_direction_10m,weather_code,precipitation&timezone=auto&forecast_days=${fDays}&temperature_unit=${tUnit}&wind_speed_unit=${wUnit}`;
    const mUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&hourly=wave_height,sea_surface_temperature,sea_level_height_msl&timezone=auto&forecast_days=${fDays}&temperature_unit=${tUnit}&cell_selection=sea`;

    try {
        const [wRes, mRes] = await Promise.all([
            fetch(wUrl).then(r => { if(!r.ok) throw new Error(); return r.json(); }),
            fetch(mUrl).then(r => { if(!r.ok) throw new Error(); return r.json(); })
        ]);

        const mergedData = { ...wRes.hourly, ...mRes.hourly };
        // キャッシュデータに現在の単位設定を保存
        const cacheData = { 
            timestamp: now, 
            data: mergedData,
            tUnit: tUnit,
            wUnit: wUnit
        };

        // 最新データを保存
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        return cacheData;

    } catch (error) {
        console.error("API取得失敗:", error);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                return { timestamp: parsed.timestamp, data: parsed.data };
            } catch (e) {
                localStorage.removeItem(cacheKey);
            }
        }
        throw error;
    }
}

/**
 * 外部気象サービスを現在の座標で開く
 * @param {string} service - 'yahoo', 'windy', 'windfinder'
 */
function openExternalWeather(service) {
    // 座標がない場合のエラー処理
    if (!currentLat || !currentLon) {
        // alert を廃止し、自作ダイアログを表示
        showAppDialog({
            title: "Location Error",      // 大きなタイトル
            messageKey: 'noLocationError' // 辞書から「地点が選択されていません」等を取得
        });
        return;
    }

    let url = "";
    switch (service) {
        case 'yahoo':
            // Yahoo!天気（ピンポイント天気検索へ）
            // ※tParamのロジックはURL生成に依存しない場合はそのままでOK
            url = `https://weather.yahoo.co.jp/weather/zoomradar/?lat=${currentLat}&&lon=${currentLon}`;
            break;

        case 'windy':
            // Windy（座標指定）
            url = `https://www.windy.com/${currentLat}/${currentLon}?${currentLat},${currentLon},11`;
            break;

        case 'windfinder':
            // Windfinder（座標指定）
            url = `https://www.windfinder.com/#11/${currentLat}/${currentLon}`;
            break;
    }

    if (url) {
        window.open(url, '_blank');
    }
}

/**
 * サブルーチン：グラフの表示位置を左端（開始点）にリセットする
 */
function resetGraphScroll() {
    const scrollRoot = document.getElementById('scroll-root');
    if (scrollRoot) {
        // スムーズに動かしたい場合は 'smooth'、即座に飛ばす場合は 'auto'
        scrollRoot.scrollTo({
            left: 0,
            behavior: 'auto' 
        });
    }
}

// ツールチップ消去用タイマー変数
let tooltipTimer = null;

/**
 * サブルーチン：メイン描画処理（制御用）
 */
async function draw() {
    try {
        // --- 実行前の安全確認：座標が未定義なら即座に初期化へ ---
        if (typeof currentLat === 'undefined' || currentLat === null || typeof currentLon === 'undefined' || currentLon === null) {
            console.warn("Location coordinates are undefined. Redirecting to initApp...");
            if (typeof initApp === 'function') {
                await initApp();
            }
            return;
        }

        allData = await fetchWithCache(currentLat, currentLon);
        const svgW = document.getElementById('svg-weather');
        if (!svgW || !allData || !allData.data) return;

        // 全データ数を確認（16日分の場合は約384以上）
        const totalDataCount = allData.data.time.length;

        // 風向アイコンを西(左)に向け、文字と1行に収まるように調整
        const baseWindIcon = `<svg width="14" height="14" viewBox="-8 -15 16 20" style="vertical-align:middle; margin-right:2px; display:inline-block;"><path d="M0,-12 L6,6 L0,2 L-6,6 Z" fill="#00d4ff" stroke="#008eb3" stroke-width="1" transform="rotate(-90)"/></svg>`;

        // --- 海上データなし判定 ---
        const now = new Date();
        const fullIdx = allData.data.time.findIndex(t => new Date(t) > now) - 1;
        const startIdx = Math.max(0, fullIdx - 4);
        
        const waveData = allData.data.wave_height ? allData.data.wave_height.slice(startIdx) : [];
        const tideData = allData.data.sea_level_height_msl ? allData.data.sea_level_height_msl.slice(startIdx) : [];
        const hasMarineData = waveData.some(v => v !== 0 && v !== null) || tideData.some(v => v !== 0 && v !== null);

        // --- Y軸ラベルのアイコン設置 ---
        const titles = document.querySelectorAll('.y-axis-title');
        if (titles.length >= 4) {
            titles[0].innerHTML = i18n.t('yAxisWeather');
            titles[1].innerHTML = `${baseWindIcon}${i18n.t('yAxisWind')}`;
            titles[2].innerHTML = i18n.t('yAxisTemp');
            
            // 翻訳ファイルの yAxisMarine ("波高(m)<br>潮位(m)") i18n.t('yAxisMarine')
            let marineTitle = "";
            if (hasMarineData) {
                marineTitle = i18n.t('yAxisMarine');
            } else {
                marineTitle = "";
                marineTitle += `<br><span style="color:#FF0000; font-weight:bold; font-size:14px; display:block; margin-top:2px;">No Marine Data</span>`;
            }
            titles[3].innerHTML = marineTitle;
        }

        const displayCount = totalDataCount - startIdx;

        // --- 設定値の取得 ---
        const hScale = viewConfig.hourWidth; 
        const labelFS = viewConfig.fontSize;
        const iScale = viewConfig.iconScale;
        const gMargin = viewConfig.graphMargin;
        const totalW = hScale * (displayCount - 1);

        // --- 各セクションの幅を更新 ---
        const secWind = document.querySelector('.section-wind');
        const secTemp = document.querySelector('.section-temp');
        const secMarine = document.querySelector('.section-marine');
        const sections = [document.querySelector('.section-weather'), secWind, secTemp, secMarine];
        
        sections.forEach(sec => {
            if(sec) sec.style.width = totalW + "px"; 
        });

        if (secWind) { secWind.style.height = viewConfig.windHeight + "px"; secWind.style.marginBottom = gMargin + "px"; }
        if (secTemp) { secTemp.style.height = viewConfig.subHeight + "px"; secTemp.style.marginBottom = gMargin + "px"; }
        if (secMarine) { secMarine.style.height = viewConfig.subHeight + "px"; }
        
        // --- 天気アイコン・降水量棒グラフ描画 ---
        let wHtml = "";
        const pData = allData.data.precipitation ? allData.data.precipitation.slice(startIdx) : [];
        const pMax = Math.ceil(Math.max(...pData, 1.0) / 5) * 5; 
        const pRange = pMax;
        const pPlotH = 40; 
        const pBaseY = 100; 

        for (let v = 0; v <= pMax; v += 5) {
            const gy = pBaseY - (v / pRange) * pPlotH;
            wHtml += `<line x1="0" y1="${gy}" x2="${totalW}" y2="${gy}" class="grid-y-sub" />`;
        }

        for(let i = startIdx; i < totalDataCount; i++) {
            const x = (i - startIdx) * hScale; 
            const icon = weatherIcons[allData.data.weather_code[i]] || "❓";
            wHtml += `<text x="${x}" y="52" font-size="28" text-anchor="middle">${icon}</text>`; 
            
            const p = allData.data.precipitation ? allData.data.precipitation[i] : 0;
            if (p > 0) {
                const barH = (p / pRange) * pPlotH;
                wHtml += `<rect x="${x - (hScale*0.3)}" y="${pBaseY - barH}" width="${hScale*0.6}" height="${barH}" fill="#0059ff" opacity="0.7" />`;
                wHtml += `<text x="${x}" y="${pBaseY - barH - 2}" font-size="${labelFS - 2}" font-weight="bold" fill="#0000FF" text-anchor="middle">${p.toFixed(1)}</text>`;
            }
        }
        svgW.innerHTML = wHtml;

        // --- 各グラフセクションの描画実行 ---
        // 風速（stepYは単位が ms 以外なら少し大きめの刻みを検討できるが、既存通り 5.0 を維持しつつ単位反映）
        renderSection("svg-wind", "date-wind", [{ data: allData.data.wind_speed_10m, type: 'bar' }], viewConfig.windHeight, 5.0, true, false, true, startIdx, hScale, totalW, labelFS, iScale, totalDataCount);
        // 気温（stepY 5.0）
        renderSection("svg-temps", "date-temp", [{ data: allData.data.temperature_2m, type: 'line', cls: 'line-temp-air' }, { data: allData.data.sea_surface_temperature, type: 'line', cls: 'line-temp-sea' }], viewConfig.subHeight, 5.0, false, !hasMarineData, false, startIdx, hScale, totalW, labelFS, iScale, totalDataCount);
        
        // 海洋データがある場合のみ描画
        if (hasMarineData) {
            renderSection("svg-marine", "date-marine", [{ data: allData.data.wave_height, type: 'line', cls: 'line-wave' }, { data: allData.data.sea_level_height_msl, type: 'line', cls: 'line-tide' }], viewConfig.subHeight, 0.5, false, true, false, startIdx, hScale, totalW, labelFS, iScale, totalDataCount);
        } else {
            // データがない場合はSVG内を空にする
            const svgM = document.getElementById("svg-marine");
            if (svgM) svgM.innerHTML = "";
            const dateM = document.getElementById("date-marine");
            if (dateM) dateM.innerHTML = "";
            const valM = document.getElementById("val-svg-marine");
            if (valM) valM.innerHTML = "";
        }

        // --- 凡例を最新の設定値・単位で更新 ---
        updateWindLegend();

        resetGraphScroll();
        initScrollEvent(hScale, startIdx);
        initTooltipEvent(startIdx, hScale, totalW, labelFS);
        
    } catch (e) { 
        console.error("Critical Draw Error:", e);
        if (typeof initApp === 'function') {
            initApp();
        }
    }
}

/**
 * サブルーチン：グラフセクション個別描画
 */
function renderSection(svgId, dateContId, datasets, height, stepY, isWind, isLast, isFirst, startIdx, hScale, totalW, labelFS, iScale, totalDataCount) {
    const svg = document.getElementById(svgId);
    const dateCont = document.getElementById(dateContId);
    const dateTop = document.getElementById('date-top');
    const timeTop = document.getElementById('time-top'); // 新設コンテナの取得
    const valCont = document.getElementById(`val-${svgId}`);

    if (!svg || !dateCont) return;
    dateCont.innerHTML = "";
    if (isFirst && dateTop) dateTop.innerHTML = "";
    if (isFirst && timeTop) timeTop.innerHTML = ""; // 初期化
    
    const allVals = datasets.flatMap(ds => ds.data ? ds.data.slice(startIdx) : [])
                            .filter(v => typeof v === 'number' && !isNaN(v));
    if (allVals.length === 0) return;
    
    let max = Math.ceil(Math.max(...allVals) / stepY) * stepY;
    let min = Math.floor(Math.min(...allVals) / stepY) * stepY;
    if (isWind) min = 0;

    if (valCont) {
        // 単位に応じてラベルの小数点以下の表示を調整（ms 以外や華氏なら整数表示の方がスッキリする場合があるが、既存のロジックを尊重）
        valCont.innerHTML = `<div class="y-max">${max.toFixed(isWind ? 0 : 1)}</div><div class="y-min">${min.toFixed(isWind ? 0 : 1)}</div>`;
    }
    const range = (max - min) || 1;
    const plotHeight = height - 20; 
    let html = "";

    for (let v = min; v <= max; v += stepY) {
        const yPosSvg = plotHeight - (((v - min) / range) * plotHeight);
        html += `<line x1="0" y1="${yPosSvg}" x2="${totalW}" y2="${yPosSvg}" class="grid-y-sub" />`;
    }

    for (let i = startIdx; i < totalDataCount; i++) {
        const x = (i - startIdx) * hScale;
        const d = new Date(allData.data.time[i]);
        
        if (i % 24 === 0 || i === startIdx) {
            html += `<line x1="${x}" y1="0" x2="${x}" y2="${plotHeight}" class="grid-day" />`;
            
            const dayIdx = d.getDay();
            let dayColor = (dayIdx === 0) ? "#FF0000" : (dayIdx === 6 ? "#0000FF" : "#000000");
            
            const localizedDateStr = getLocalizedDate(d);
            const labelContent = `<span style="color:${dayColor}; font-size:${labelFS * 1.5}px;" class="notranslate">${localizedDateStr}</span>`;

            const dateDiv = document.createElement('div');
            dateDiv.className = 'sticky-date';
            dateDiv.style.left = `${x}px`;
            dateDiv.dataset.x = x;

            if (isFirst && dateTop) {
                const topDiv = document.createElement('div');
                topDiv.className = 'sticky-date';
                topDiv.style.left = `${x}px`;
                topDiv.dataset.x = x;
                topDiv.innerHTML = labelContent;
                dateTop.appendChild(topDiv);

                // 時刻コンテナ(time-top)に「時」を追加
                const topTimeDiv = document.createElement('div');
                topTimeDiv.style.position = 'absolute';
                topTimeDiv.style.left = `${x}px`;
                topTimeDiv.style.transform = 'translateX(-50%)';
                topTimeDiv.dataset.x = x;
                topTimeDiv.innerHTML = `<span class="label-time" style="font-size:${labelFS+4}px; display: inline-block; width: 2em; text-align: center;">${d.getHours()}</span>`;
                timeTop.appendChild(topTimeDiv);
            }

            if (isLast) {
                dateDiv.innerHTML = labelContent;
                html += `<text x="${x}" y="${plotHeight + 15}" class="label-time" font-size="${labelFS}" text-anchor="middle">${d.getHours()}</text>`;
            }
            dateCont.appendChild(dateDiv);
        } else if (i % 3 === 0) {
            html += `<line x1="${x}" y1="0" x2="${x}" y2="${plotHeight}" class="grid-3h" />`;
            
            if (isFirst && timeTop) {
                const topTimeDiv = document.createElement('div');
                topTimeDiv.style.position = 'absolute';
                topTimeDiv.style.left = `${x}px`;
                topTimeDiv.style.transform = 'translateX(-50%)';
                topTimeDiv.dataset.x = x;
                topTimeDiv.innerHTML = `<span class="label-time" style="font-size:${labelFS+4}px; display: inline-block; width: 2em; text-align: center;">${d.getHours()}</span>`;
                timeTop.appendChild(topTimeDiv);
            }

            if (isLast) {
                html += `<text x="${x}" y="${plotHeight + 15}" class="label-time" font-size="${labelFS}" text-anchor="middle">${d.getHours()}</text>`;
            }
        }
    }

    const startTime = new Date(allData.data.time[startIdx]).getTime();
    const nowTime = new Date().getTime();
    const diffHoursNow = (nowTime - startTime) / (1000 * 60 * 60); 
    if (diffHoursNow >= 0 && diffHoursNow < (totalDataCount - startIdx)) {
        const nowX = diffHoursNow * hScale;
        html += `<line x1="${nowX}" y1="0" x2="${nowX}" y2="${plotHeight}" stroke="#0000FF" stroke-width="2.5" stroke-dasharray="4 3" />`;
    }
    if (allData.timestamp) {
        const fetchedTime = new Date(allData.timestamp).getTime();
        const diffHoursFetch = (fetchedTime - startTime) / (1000 * 60 * 60); 
        if (diffHoursFetch >= 0 && diffHoursFetch < (totalDataCount - startIdx)) {
            const fetchX = diffHoursFetch * hScale;
            html += `<line x1="${fetchX}" y1="0" x2="${fetchX}" y2="${plotHeight}" stroke="#228b22" stroke-width="2.5" stroke-dasharray="3 2" />`;
        }
    }

    datasets.forEach(ds => {
        if (ds.type === 'bar') {
            for(let i = startIdx; i < totalDataCount; i++){
                // renderSection 内、ds.type === 'bar' のループ内
                const val = ds.data[i];
                if (val === null || typeof val === 'undefined') continue;

                const h = ((val - min) / range) * plotHeight;
                const x = (i - startIdx) * hScale;
                const deg = allData.data.wind_direction_10m[i];
                const dirText = getWindDirText(deg);

                // --- 修正箇所：viewConfig から閾値を取得 ---
                const thHigh = viewConfig.windThresholdHigh;
                const thMid  = viewConfig.windThresholdMid;
                const thLow  = viewConfig.windThresholdLow;

                // 取得した閾値を使用して色を判定
                let color = targetWindDirections.includes(dirText) 
                    ? (val >= thHigh ? '#dc143c' : val >= thMid ? '#ffa500' : val >= thLow ? '#87CEEB' : '#ccc') 
                    : (val >= thHigh ? 'rgba(220, 20, 60, 0.4)' : '#ccc');

                html += `<rect x="${x - (hScale*0.4)}" y="${plotHeight-h}" width="${hScale*0.8}" height="${h}" fill="${color}" />`;
                if (isWind) {
                    html += `<path d="M0,-12 L6,6 L0,2 L-6,6 Z" transform="translate(${x}, ${plotHeight-h-25}) rotate(${(deg+180)%360}) scale(${1.6 * iScale})" class="wind-arrow" />`;
                }
            }
        } else {
            let currentPoints = [];
            for(let i = startIdx; i < totalDataCount; i++){
                const v = ds.data[i];
                if (v === null || typeof v === 'undefined') {
                    if (currentPoints.length > 1) {
                        html += `<polyline class="${ds.cls}" points="${currentPoints.join(' ')}" />`;
                    }
                    currentPoints = [];
                    continue;
                }
                const x = (i - startIdx) * hScale;
                const y = plotHeight - (((v - min) / range) * plotHeight);
                currentPoints.push(`${x},${y}`);
            }
            if (currentPoints.length > 1) {
                html += `<polyline class="${ds.cls}" points="${currentPoints.join(' ')}" />`;
            }
        }
    });
    svg.innerHTML = html;
}

/**
 * サブルーチン：ツールチップイベントの初期化
 */
function initTooltipEvent(startIdx, hScale, totalW, labelFS) {
    const stage = document.getElementById('stage');
    const guide = document.getElementById('hover-guide');
    const tooltip = document.getElementById('tooltip');

    if (!stage || !guide || !tooltip) return;

    const updateTooltipContent = (hourIdx, clientX, clientY, isAutoScroll = false, currentScrollLeft = 0) => {
        if (!allData || !allData.data || !allData.data.time) return;
        
        const sIdx = Number(startIdx);
        const hs = Number(hScale);
        const maxIdx = allData.data.time.length - 1;
        const validIdx = Math.min(Math.max(Math.round(hourIdx), sIdx), maxIdx);

        const rawTime = allData.data.time[validIdx];
        if (!rawTime) return;

        const d = new Date(rawTime);
        const snapX = (validIdx - sIdx) * hs + 100;
        
        guide.style.left = snapX + "px"; 
        guide.style.display = "block";
        tooltip.style.display = "block";
        
        if (tooltipTimer) clearTimeout(tooltipTimer);

        const localizedDateStr = getLocalizedDate(d);
        const deg = allData.data.wind_direction_10m ? allData.data.wind_direction_10m[validIdx] : null;
        const wIcon = weatherIcons[allData.data.weather_code[validIdx]] || "❓";
        const getVal = (val, unit, fixed = 1) => (val !== null && typeof val !== 'undefined' && !isNaN(val)) ? val.toFixed(fixed) + unit : "---";

        // 設定に基づいた単位の取得
        const tUnit = viewConfig.temperatureUnit === 'celsius' ? '℃' : '℉';
        const wUnit = i18n.t('speedunit'); // i18n側の動的定義を使用

        const precipVal = getVal(allData.data.precipitation ? allData.data.precipitation[validIdx] : null, "mm");
        const windVal = getVal(allData.data.wind_speed_10m ? allData.data.wind_speed_10m[validIdx] : null, wUnit);
        const tempVal = getVal(allData.data.temperature_2m ? allData.data.temperature_2m[validIdx] : null, tUnit);
        const seaTempVal = getVal(allData.data.sea_surface_temperature ? allData.data.sea_surface_temperature[validIdx] : null, tUnit);
        const waveVal = getVal(allData.data.wave_height ? allData.data.wave_height[validIdx] : null, "m", 2);
        const tideVal = getVal(allData.data.sea_level_height_msl ? allData.data.sea_level_height_msl[validIdx] : null, "m", 2);

        const rotateDeg = (deg !== null && !isNaN(deg)) ? (deg + 180) % 360 : 0;

        const n = new Date();
        const nDayStr = i18n.dict[i18n._currentLang].days[n.getDay()];
        const nStr = `${n.getMonth()+1}/${n.getDate()}(${nDayStr}) ${n.getHours()}:${n.getMinutes().toString().padStart(2, '0')}`;
        let ftStr = "--/--(曜) --:--";
        if (allData.timestamp) {
            const ft = new Date(allData.timestamp);
            const ftDayStr = i18n.dict[i18n._currentLang].days[ft.getDay()];
            ftStr = `${ft.getMonth()+1}/${ft.getDate()}(${ftDayStr}) ${ft.getHours()}:${ft.getMinutes().toString().padStart(2, '0')}`;
        }

        tooltip.innerHTML = `
            <span class="spot-name-tip">📍 ${currentLabel}</span>
            <span class="coord-tip notranslate">${currentLat.toFixed(3)}, ${currentLon.toFixed(3)}</span>
            <b class="notranslate">${localizedDateStr} ${d.getHours()}:00 ${wIcon}</b>
            <div class="icon-box"><span class="legend-bar" style="background:#0000FF; margin-right:0;"></span></div>${i18n.t('precip')}: ${precipVal}<br>
            <div class="icon-box"><svg width="14" height="14" viewBox="-8 -15 16 20" style="vertical-align:middle;"><path d="M0,-12 L6,6 L0,2 L-6,6 Z" fill="#00d4ff" stroke="#008eb3" stroke-width="1" transform="rotate(${rotateDeg})"/></svg></div>${i18n.t('windDir')}: ${deg !== null && !isNaN(deg) ? getWindDirText(deg) + ' (' + deg + '°)' : '---'}<br>
            <div class="icon-box">🚩</div>${i18n.t('windSpeed')}: ${windVal}<br>
            <div class="icon-box"><span class="legend-line" style="background:#ff4500; margin-right:0;"></span></div>${i18n.t('temp')}: ${tempVal}<br>
            <div class="icon-box"><span class="legend-line" style="background:#00ced1; margin-right:0;"></span></div>${i18n.t('seawater')}: ${seaTempVal}<br>
            <div class="icon-box"><span class="legend-line" style="background:#2ca02c; margin-right:0;"></span></div>${i18n.t('wave')}: ${waveVal}<br>
            <div class="icon-box"><span class="legend-line" style="background:#1e90ff; margin-right:0;"></span></div>${i18n.t('tide')}: ${tideVal}
            <div style="margin-top:6px; border-top:1px solid #444; padding-top:4px; font-size:11px; color:#ccc; line-height:1.4;" class="notranslate">
                <span style="display:inline-block; width:15px; border-top:4px dotted #0000FF; vertical-align:middle; margin-right:4px;"></span>${i18n.t('nowTime')} ${nStr}<br>
                <span style="display:inline-block; width:15px; border-top:4px dotted #228b22; vertical-align:middle; margin-right:4px;"></span>${i18n.t('fetchTime')} ${ftStr}
            </div>
        `;

        tooltip.style.position = "fixed";
        tooltip.style.transform = "none";

        if (isAutoScroll) {
            tooltip.style.left = (100 + hs * 3) + "px";
            tooltip.style.bottom = "20px"; 
            tooltip.style.top = "auto";
        } else {
            const tooltipWidth = tooltip.offsetWidth || 220;
            let tx = (clientX > window.innerWidth / 2) ? clientX - tooltipWidth - 20 : clientX + 20;
            tooltip.style.left = tx + "px";
            let ty = clientY + 20;
            if (ty + tooltip.offsetHeight > window.innerHeight) {
                tooltip.style.bottom = "10px";
                tooltip.style.top = "auto";
            } else {
                tooltip.style.top = ty + "px";
                tooltip.style.bottom = "auto";
            }
        }

        const tooltipDur = viewConfig.tooltipDuration * 1000;    
        tooltipTimer = setTimeout(() => hideTooltipUI(), tooltipDur);
    };

    stage.onmousemove = (e) => {
        const rect = stage.getBoundingClientRect();
        const graphX = (e.clientX - rect.left) - 100;
        if (graphX < 0 || graphX > totalW) { hideTooltipUI(); return; }
        const hourIdx = (graphX / Number(hScale)) + Number(startIdx);
        updateTooltipContent(hourIdx, e.clientX, e.clientY, false);
    };

    stage.onclick = (e) => {
        const rect = stage.getBoundingClientRect();
        const graphX = (e.clientX - rect.left) - 100;
        if (graphX < 0 || graphX > totalW) return;
        const hourIdx = (graphX / Number(hScale)) + Number(startIdx);
        updateTooltipContent(hourIdx, e.clientX, e.clientY, false);
    };

    stage.onmouseleave = () => hideTooltipUI();
    window.updateTooltipFromScroll = updateTooltipContent;
}

/**
 * サブルーチン：スクロールイベントの初期化
 */
function initScrollEvent(hScale, startIdx) {
    const scrollRoot = document.getElementById('scroll-root');
    if (scrollRoot) {
        scrollRoot.onscroll = () => {
            const sl = Number(scrollRoot.scrollLeft);
            const hs = Number(hScale);
            const sIdx = Number(startIdx);
            
            document.querySelectorAll('.sticky-date').forEach(el => {
                const x = parseFloat(el.dataset.x);
                const nextX = x + (24 * hs);
                if (sl >= x && sl < nextX - 100) {
                    el.style.left = (sl - 100) + "px";
                } else {
                    el.style.left = x + "px";
                }
            });

            if (typeof window.updateTooltipFromScroll === 'function' && !isNaN(hs) && !isNaN(sIdx)) {
                const visualOffset = hs * 2; 
                const targetX = sl + visualOffset; 
                const hourIdx = (targetX / hs) + sIdx;
                window.updateTooltipFromScroll(hourIdx, 0, 0, true, sl);
            }
        };
        scrollRoot.dispatchEvent(new Event('scroll'));
    }
}

/**
 * サブルーチン：ツールチップとガイド線を非表示にする
 */
function hideTooltipUI() {
    const guide = document.getElementById('hover-guide');
    const tooltip = document.getElementById('tooltip');
    if (guide) guide.style.display = "none";
    if (tooltip) {
        tooltip.style.display = "none";
        tooltip.style.bottom = "auto";
        tooltip.style.top = "auto";
    }
    if (tooltipTimer) {
        clearTimeout(tooltipTimer);
        tooltipTimer = null;
    }
}

/**
 * サブルーチン：風速凡例の動的表示更新
 */
function updateWindLegend() {
    const container = document.querySelector('.legend-wind-container');
    if (!container) return;

    // 現在の単位ラベルを取得（例：m/s, kn）
    const unit = i18n.t('speedunit'); 

    container.innerHTML = `
        <div class="legend-wind-item">
            <span class="legend-wind-label" data-i18n="legendWindTitle">${i18n.t('legendWindTitle')}</span>
            <span class="legend-wind-rect" style="background: #dc143c;"></span>
            <span class="legend-wind-label">${viewConfig.windThresholdHigh}${unit}〜</span>
        </div>
        <div class="legend-wind-item">
            <span class="legend-wind-rect" style="background: #ffa500;"></span>
            <span class="legend-wind-label">${viewConfig.windThresholdMid}${unit}〜</span>
        </div>
        <div class="legend-wind-item">
            <span class="legend-wind-rect" style="background: #87ceeb;"></span>
            <span class="legend-wind-label">${viewConfig.windThresholdLow}${unit}〜</span>
        </div>
        <div class="legend-wind-item">
            <span class="legend-wind-rect" style="background: #ccc;"></span>
            <span class="legend-wind-label">…</span>
        </div>
    `;
}


/**
 * 監視リスナー：4時間経過判定
 * ブラウザがアクティブになった際、キャッシュが古い場合は再描画します。
 */
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        const keys = Object.keys(localStorage).filter(k => k.startsWith('weather_cache_'));
        if (keys.length === 0) return;
        
        const cached = JSON.parse(localStorage.getItem(keys[0]));
        const now = Date.now();
        // 4時間 = 14,400,000ミリ秒
        if (now - cached.timestamp > CACHE_DURATION) {
            console.log("4時間以上経過したため、再描画を実行します");
            draw();
        }
    }
});

// ==========================================
// PWAインストール制御サブルーチン
// ==========================================
let deferredPrompt;

// iOSおよびスタンドアロン起動の判定
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

/**
 * インストール誘導の初期化
 */
function initPwaInstall() {
    const installContainer = document.getElementById('pwa-install-container');
    const installBtn = document.getElementById('btn-pwa-install');
    if (!installContainer || !installBtn) return;

    // すでにアプリとして起動しているなら、何も表示しない
    if (isStandalone) {
        installContainer.style.display = 'none';
        return;
    }

    // A. Android / PC (Chromeなど) の場合
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installContainer.style.display = 'block';
    });

    // B. iOS (Safari) の場合
    if (isIOS) {
        installContainer.style.display = 'block';
    }

    // ボタンクリック時の挙動
    installBtn.onclick = async () => {
        if (isIOS) {
            alert(`${i18n.t('iosInstallTitle')}\n\n${i18n.t('iosInstallGuide')}`);
        } else if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                installContainer.style.display = 'none';
            }
            deferredPrompt = null;
        } else {
            // 【重要】ブラウザがボタンを自動で出さない場合の救済策
            // 古いアイコンがあっても、ブラウザのメニューから直接インストールは可能です
            alert("新しいURLでアプリを登録します。\n\nブラウザ右上のメニュー（︙）から「アプリをインストール」または「ホーム画面に追加」を選択してください。");
        }
    };
}

// インストール完了時の自動非表示
window.addEventListener('appinstalled', () => {
    const installContainer = document.getElementById('pwa-install-container');
    if (installContainer) installContainer.style.display = 'none';
    deferredPrompt = null;
});

// DOM構築後に実行
window.addEventListener('DOMContentLoaded', initPwaInstall);

/**
 * サブルーチン：新ドメイン移行案内の表示
 * 概要：旧ドメインから新ドメインへのデータ引継ぎを行い、完了後はユーザーにアプリを閉じてブラウザで開き直すよう促す。
 */
function checkDomainMigration() {
    const currentHost = window.location.hostname;
    const newDomain = "pin-weather.pro"; 

    // 1. 旧ドメイン（onrender.com）での処理
    if (currentHost.includes("onrender.com")) {
        window.goNewDomain = function() {
            const spotsData = localStorage.getItem('pin_weather_spots');
            const viewConfigData = localStorage.getItem('pin_weather_view_config');
            const windFilterData = localStorage.getItem('pin_weather_wind_filter');
            
            let targetUrl = `https://${newDomain}/`;
            const migrationPackage = {
                spots: spotsData,
                viewConfig: viewConfigData,
                windFilter: windFilterData
            };
            const dataString = encodeURIComponent(JSON.stringify(migrationPackage));
            targetUrl += `?migration_all=${dataString}`;
            
            window.location.replace(targetUrl);
        };

        const banner = document.createElement('div');
        banner.id = 'migration-banner';
        banner.style.cssText = 'position:fixed;top:0;left:0;width:100%;background-color:#d32f2f;color:white;text-align:center;padding:15px 10px;z-index:10000;font-size:14px;box-shadow:0 2px 10px rgba(0,0,0,0.3);';
        banner.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 5px;">【重要】URL移行とデータ引継ぎ</div>
            <div style="margin-bottom: 10px; font-size: 14px; line-height: 1.4;">
                専門ドメインへ移動します。登録地点も自動で引き継がれます。<br>
                移動後、一度このアプリを閉じてから、ブラウザで開き直してください。
            </div>
            <button onclick="goNewDomain()" style="background-color: white; color: #d32f2f; border: none; padding: 10px 20px; border-radius: 5px; font-weight: bold; cursor: pointer;">地点データを保持して移動する</button>
        `;
        document.body.prepend(banner);
        document.body.style.paddingTop = "130px";
    }

    // 2. 新ドメイン（pin-weather.pro）に届いた直後の処理
    if (currentHost === newDomain || currentHost === `www.${newDomain}`) {
        const urlParams = new URLSearchParams(window.location.search);
        const migrationAll = urlParams.get('migration_all');
        
        if (migrationAll) {
            try {
                const parsed = JSON.parse(decodeURIComponent(migrationAll));
                if (parsed.spots) localStorage.setItem('pin_weather_spots', parsed.spots);
                if (parsed.viewConfig) localStorage.setItem('pin_weather_view_config', parsed.viewConfig);
                if (parsed.windFilter) localStorage.setItem('pin_weather_wind_filter', parsed.windFilter);

                // 保存が完了したら、パラメータのないクリーンなURLへ差し替え
                sessionStorage.setItem('migration_final_alert', 'true');
                window.location.replace(window.location.origin + window.location.pathname);
                return; 
            } catch (e) {
                console.error("Migration error", e);
            }
        }

        // 3. パラメータが消えた後、ユーザーに「終了とブラウザ起動」を命じる
        if (sessionStorage.getItem('migration_final_alert') === 'true') {
            setTimeout(() => {
                sessionStorage.removeItem('migration_final_alert');
                
                // showAppDialogが存在することを確認して呼び出し
                if (typeof showAppDialog === 'function') {
                    showAppDialog({
                        title: "データ引継ぎ完了",
                        message: "データの移行に成功しました。\n\n現在の「古いアプリ」を一度完全に閉じてください。\nその後、ブラウザ（Chrome等）を起動し、新たに「https://pin-weather.pro」へアクセスして、ホーム画面に再登録をお願いします。",
                        onSave: () => {
                            // ユーザーが了解した後に、視覚的に終了を促す（閉じる機能がないため、白紙にする等の処理）
                            document.body.innerHTML = '<div style="padding:50px; text-align:center; font-family:sans-serif;"><h3>移行準備が整いました</h3><p>このアプリ（古いアイコン）を閉じてください。<br><br>その後、通常のブラウザで<br><b>https://pin-weather.pro</b><br>を開いてください。</p></div>';
                        }
                    });
                }
            }, 1000);
        }
    }
}

initApp();
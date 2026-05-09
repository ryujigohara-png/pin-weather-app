// 1. データの入れ物
let allData = {};

// 2. 詳細設定の初期値
const defaultViewConfig = {
    forecastDays: 7,           // 予報日数（最大16日）
    tooltipDuration: 3,         // ツールチップ表示時間（s）
    temperatureUnit: 'celsius', // 気温単位
    windSpeedUnit: 'ms',        // 風速単位
    // --- 風速色付け閾値（初期値） ---
    windThresholdHigh: 10.0,
    windThresholdMid: 5.0,
    windThresholdLow: 3.0,
    // ----------------------------
    iconScale: 0.7,             // 風向アイコン倍率
    hourWidth: 18,              // 1時間の幅
    windHeight: 100,            // 風速グラフ高さ
    subHeight: 100,             // 気温・海象グラフ高さ
    graphMargin: 0,             // グラフ間余白
    fontSize: 12,               // ラベルフォントサイズ
    language: 'ja'              // 言語設定
};

// 3. localStorage からの読み込みとマージ
const savedConfig = JSON.parse(localStorage.getItem('pin_weather_view_config')) || {};
let viewConfig = { ...defaultViewConfig, ...savedConfig };

// 初回訪問時（localStorageに保存がない場合）の言語判定
if (!savedConfig.language) {
    const browserLang = navigator.language || navigator.userLanguage;
    if (!browserLang.startsWith('ja')) {
        viewConfig.language = 'en';
    }
}

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
            nowTime: "描画時刻(端末)",
            fetchTime: "データ取得(端末)",

            // --- サイドバー・基本UI ---
            btnPwaInstall: "📲 アプリをインストール",
            iosInstallTitle: "iPhoneをご利用の方へ",
            iosInstallGuide: "Safariの「共有ボタン（□に↑）」を押し、「ホーム画面に追加」を選択してください。",
            btnWindConfig: "🎐 風向色付設定",
            btnDetailSettings: "⚙ 表示詳細設定",
            btnFeedback: "💬 ご意見・ご要望",
            linkAboutAndPrivacy: "運営者情報 ＆ プライバシーポリシー",
            shareQR: "スマホで共有",
            btnCopyUrl: "🔗 URLをコピー",
            copySuccess: "✅ コピー完了！",
            copyError: "コピーに失敗しました。",
            btnWidget: "🧩 ホームページに埋め込む",
            widgetTitle: "ウィジェット埋め込み設定",
            widgetDesc: "あなたのサイトにこの地点の気象グラフを埋め込むことができます。",
            widgetCopy: "コードをコピー",

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
            btnApply: "更新",

            // --- 表示詳細設定モーダル ---
            settingsTitle: "グラフ表示詳細設定",
            configLangTitle: "Language / 表示言語",
            cfgForecastDays: "予報日数 (最大16日)",
            btnOptionalOpen: "オプション設定 (表示倍率・サイズ等) ▼",
            btnOptionalClose: "オプション設定を閉じる ▲",
            cfgHourWidth: "1時間の幅 (hScale)",
            cfgWindHeight: "風速グラフの高さ",
            cfgSubHeight: "気温・海象グラフの高さ",
            cfgMargin: "グラフ間の余白",
            cfgFontSize: "ラベル文字サイズ",
            cfgIconScale: "風向アイコン倍率",
            cfgTooltipDuration: "詳細情報の表示時間", 
            cfgTempUnit: "温度単位",
            cfgWindUnit: "風速単位",
            cfgWindThresholds: "風速色付しきい値",
            saveGuideText: "※保存するとページが再読み込みされ、設定が反映されます。",
            btnSaveSettings: "設定を保存",
            btnRestoreDefault: "デフォルトに戻す",
            btnLoadDefault: "デフォルトを読込",
            btnSaveDefault: "デフォルトに保存",
            
            // --- 確認ダイアログ用追加分 ---
            msgLoadConfirmTitle: "読込の確認",
            msgLoadConfirmDesc: "保存されているデフォルト設定を読み込みますか？（現在の選択は上書きされます）",
            msgSaveConfirmTitle: "保存の確認",
            msgSaveConfirmDesc: "現在の設定をデフォルトとして保存しますか？",
            
            msgLoadComplete: "読込完了",
            msgLoadDesc: "デフォルト設定を読み込みました。",
            msgSaveComplete: "保存完了",
            msgSaveDesc: "現在の設定をデフォルトとして保存しました。",

            // --- グラフ軸・凡例・その他（動的対応版） ---
            yAxisWeather: "天気<br>降水(mm)",
            yAxisWind: `風向<br>風速(${viewConfig.windSpeedUnit === 'ms' ? 'm/s' : viewConfig.windSpeedUnit === 'kn' ? 'kn' : viewConfig.windSpeedUnit === 'kmh' ? 'km/h' : 'mph'})`,
            yAxisTemp: `気温(${viewConfig.temperatureUnit === 'celsius' ? '℃' : '℉'})<br>海水(${viewConfig.temperatureUnit === 'celsius' ? '℃' : '℉'})`,
            yAxisMarine: "波高(m)<br>潮位(m)",
            legendWindTitle: "風向色付：",
            speedunit: viewConfig.windSpeedUnit === 'ms' ? 'm/s' : viewConfig.windSpeedUnit === 'kn' ? 'kn' : viewConfig.windSpeedUnit === 'kmh' ? 'km/h' : 'mph',
            disclaimer: "【免責事項】海上気象データは予測モデルに基づく「最寄りの海上地点」の数値であり、実際の局地的な地形や潮流による影響を反映しきれない場合があります。",
            
            guideMainTitle: "Pin-Weather.Pro 活用ガイド",
            guideLabel1: "16日間気象予報・8日間海洋気象予報",
            guideBody1: "風速・風向・気温などの気象データは<strong>最大16日間</strong>表示。<br>波高・潮位・海水温などの海洋データは<strong>最大8日間</strong>表示。<br>長期の遠征計画から直近の出艇判断までサポートします。",
            guideLabel2: "MySpots 10箇所登録",
            guideBody2: `お気に入りのゲレンデやマリーナを最大10箇所まで保存可能。登録した地点はタブで簡単に切り替え可能。各地点の天気をすぐに確認できます。<br><br>
                        <strong>登録方法：</strong><br>
                        ・GPSボタンで現在地を取得、またはマップ上の任意の地点をタップして📌を立てることで、好きな場所を登録できます。<br>
                        ・マップ内の検索ボックスから施設名や地名で検索して登録することも可能です。<br><br>
                        <strong>管理・修正：</strong><br>
                        ・画面上の地点タブを長押しすると、登録地点の修正や削除が簡単に行えます。<br>
                        ・現在表示中のグラフ地点をマップで即座に確認し、再調整することも可能です.`,
            guideLabel3: "自分専用表示カスタマイズ",
            guideBody3: `<strong>風向色付設定</strong>ボタンから色付けする風向を指定可能。<br>
                        <strong>表示詳細設定</strong>ボタンから風速の色付けしきい値を変更可能。自分の道具やレベルに合わせた「ベストコンディション」がグラフ上で一目で判別できるようになります。`,

            // --- メッセージ類 ---
            pwa_install_msg: "「ホーム画面に追加」⇒次からワンクリックで開けます！",
            pwa_install_sub: "左上の≡メニュー内「インストール」または、<br>Chrome ⋮ メニューから / Safari 共有 から<br>「ホーム画面に追加」",
            welcomeGuide: "表示したい地点を登録してください。現在地を取得するか、地図から場所を選択できます。登録は画面上部の地名タブを長押しまたは右クリックしてください。",
            confirmDelete: (name) => `「${name}」を削除しますか？`,
            lastSpotWarning: "最後の1箇所は削除できません。アプリの動作には少なくとも1つの地点登録が必要です。",
            confirmReset: "表示設定をデフォルトに戻しますか？",
            gpsFetching: "取得中...",
            gpsError: "位置情報の取得に失敗しました。",
            gpsDefaultLabel: "現在地(GPS)",
            noLocationError: "地点情報がありません。",
            editSpotGuide: "地点名を編集、または削除します",
            btnDelete: "削除",
            confirmDeletePrefix: "本当に削除しますか：",

            condition_summary_btn: "概況",
            summary_title: "【概況】",
            as_of: "現在",
            tomorrow: "明日",
            analyzing: "予報データを分析中...",
            weather_now: "現在は{weather}ですが、",
            weather_change: "{day}{time}時頃から{status}見込みです。",
            status_clear: "晴れ間が多くなる",
            status_cloud: "雲が多くなる",
            status_rain: "雨が降り出す",
            status_snow: "雪が降り出す",
            status_thunder: "雷雨になる",
            stable_weather: "向こう24時間は安定した天気が続く予報です。",
            temp_info: "気温は最高{max}{unit}、最低{min}{unit}で、",
            temp_diff_warn: "寒暖差にご注意ください。",
            temp_stable: "落ち着いた推移となるでしょう。",
            wind_current: "風は現在、{dir}の風が{speed}{unit}ですが、",
            wind_strengthen: "{day}{time}時頃にかけて強まり、最大で{maxDir}の風が{maxSpeed}{unit}に達する予報です。",
            wind_stable: "今後も{dir}寄りの風が安定して吹く見込みです。",
            wave_current: "波高は現在{current}mですが、",
            wave_rise: "次第に高まり、{future}m前後に達する傾向にあります。",
            wave_fall: "徐々に落ち着き、{future}m前後まで下がる見込みです。",
            wave_stable: "明日まで大きな変化はなく、概ね安定した海面コンディションが続くでしょう。"
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
            nowTime: "Render(Device)",
            fetchTime: "Fetched(Device)",

            // --- Sidebar & Base UI ---
            btnPwaInstall: "📲 Install App",
            iosInstallTitle: "For iPhone Users",
            iosInstallGuide: "Tap the 'Share button' in Safari and select 'Add to Home Screen'.",
            btnWindConfig: "🎐 Wind Color Settings",
            btnDetailSettings: "⚙ Display Settings",
            btnFeedback: "💬 Feedback & Requests",
            linkAboutAndPrivacy: "About & Privacy Policy",    
            shareQR: "Share with Mobile",
            btnCopyUrl: "🔗 Copy URL",
            copySuccess: "✅ Copied!",
            copyError: "Failed to copy.",
            btnWidget: "🧩 Embed in Website",
            widgetTitle: "Widget Embedding Settings",
            widgetDesc: "You can embed this weather graph into your website or blog.",
            widgetCopy: "Copy Code",

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
            btnApply: "Update",

            // --- Detail Settings Modal ---
            settingsTitle: "Detailed Display Settings",
            configLangTitle: "Language",
            cfgForecastDays: "Forecast Days (Max 16)",
            btnOptionalOpen: "Optional Settings (Scale, Size, etc.) ▼",
            btnOptionalClose: "Close Optional Settings ▲",
            cfgHourWidth: "Hour Width (hScale)",
            cfgWindHeight: "Wind Graph Height",
            cfgSubHeight: "Sub Graph Height",
            cfgMargin: "Graph Margin",
            cfgFontSize: "Font Size",
            cfgIconScale: "Icon Scale",
            cfgTooltipDuration: "Info Display Duration",
            cfgTempUnit: "Temperature Unit",
            cfgWindUnit: "Wind Speed Unit",
            cfgWindThresholds: "Wind Coloring Thresholds",
            saveGuideText: "*Saving will reload the page to apply settings.",
            btnSaveSettings: "Save Settings",
            btnRestoreDefault: "Restore Default",
            btnLoadDefault: "Load Default",
            btnSaveDefault: "Set Default",
            
            // --- Confirm Dialog for Settings ---
            msgLoadConfirmTitle: "Confirm Load",
            msgLoadConfirmDesc: "Do you want to load the saved default settings? (Current selection will be overwritten)",
            msgSaveConfirmTitle: "Confirm Save",
            msgSaveConfirmDesc: "Do you want to save the current settings as default?",
            
            msgLoadComplete: "Loaded",
            msgLoadDesc: "Default settings loaded.",
            msgSaveComplete: "Saved",
            msgSaveDesc: "Current settings saved as default.",

            // --- Axes, Legends, etc.（動的対応版） ---
            yAxisWeather: "Weather<br>Precip(mm)",
            yAxisWind: `Wind Dir<br>Speed(${viewConfig.windSpeedUnit === 'ms' ? 'm/s' : viewConfig.windSpeedUnit === 'kn' ? 'kn' : viewConfig.windSpeedUnit === 'kmh' ? 'km/h' : 'mph'})`,
            yAxisTemp: `Temp(${viewConfig.temperatureUnit === 'celsius' ? '°C' : '°F'})<br>Sea(${viewConfig.temperatureUnit === 'celsius' ? '°C' : '°F'})`,
            yAxisMarine: "Wave(m)<br>Tide(m)",
            legendWindTitle: "Wind Color:",
            speedunit: viewConfig.windSpeedUnit === 'ms' ? 'm/s' : viewConfig.windSpeedUnit === 'kn' ? 'kn' : viewConfig.windSpeedUnit === 'kmh' ? 'km/h' : 'mph',
            disclaimer: "[Disclaimer] Marine weather data is based on forecast models for the 'nearest sea point' and may not reflect local terrain or tidal effects.",

            guideMainTitle: "Pin-Weather.Pro User Guide",
            guideLabel1: "16-day Weather & 8-day Marine Forecast",
            guideBody1: "Weather data (wind, temp) is available for up to <strong>16 days</strong>, and marine data (waves, tides) for up to <strong>8 days</strong>.",
            guideLabel2: "Register 10 MySpots",
            guideBody2: `Save up to 10 favorite spots. Switch easily via tabs.<br><br>
                        <strong>Registration:</strong><br>
                        ・Use GPS or tap the map to drop a 📌.<br>
                        ・Search by name or facility.<br><br>
                        <strong>Management:</strong><br>
                        ・Long-press tabs to edit or delete.<br>
                        ・Verify and adjust current locations on the map instantly.`,
            guideLabel3: "Custom Display Settings",
            guideBody3: `Specify which wind directions to highlight from the <strong>Wind Color Settings</strong> button.<br>
                        Adjust <strong>Wind Speed Thresholds</strong> from the <strong>Display Settings</strong> button to match your gear and skill level.`,

            // --- Messages ---
            pwa_install_msg: "Add to Home Screen for instant access!",
            pwa_install_sub: "Select \"Install\" from the ≡ menu,<br>or use the browser menu (Chrome ⋮ / Safari Share)<br>and tap \"Add to Home Screen\"",
            welcomeGuide: "Please register the locations you want to display. You can get your current location or select a place from the map. To register, long-press or right-click on the location tab at the top of the screen.",
            confirmDelete: (name) => `Delete "${name}"?`,
            lastSpotWarning: "Cannot delete the last spot. At least one location is required for the app to function.",
            confirmReset: "Reset all view settings to default?",
            gpsFetching: "Locating...",
            gpsError: "Failed to get location.",
            gpsDefaultLabel: "Current Location (GPS)",
            noLocationError: "No location information available.",
            editSpotGuide: "Edit or delete the spot name",
            btnDelete: "Delete",
            confirmDeletePrefix: "Are you sure you want to delete:",

            condition_summary_btn: "Summary",
            summary_title: "[Summary] ",
            as_of: "As of",
            tomorrow: "tomorrow ",
            analyzing: "Analyzing forecast data...",
            weather_now: "Currently {weather}, ",
            weather_change: "weather is expected to change around {day}{time}:00.",
            weather_change: "{status} is expected around {day}{time}:00.",
            status_clear: "clearer skies",
            status_cloud: "cloudy skies",
            status_rain: "rain",
            status_snow: "snow",
            status_thunder: "thunderstorms",
            temp_info: "High: {max}{unit}, Low: {min}{unit}. ",
            temp_diff_warn: "Watch for temperature swings.",
            temp_stable: "Temperatures will remain steady.",
            wind_current: "Wind is {dir} at {speed}{unit}, ",
            wind_strengthen: "expected to strengthen to {maxSpeed}{unit} from {maxDir} around {day}{time}:00.",
            wind_stable: "Stable {dir} winds are expected to continue.",
            wave_current: "Wave height is {current}m, ",
            wave_rise: "expected to rise to around {future}m.",
            wave_fall: "expected to subside to around {future}m.",
            wave_stable: "expected to remain stable through tomorrow."
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
        
        // コンディション概況ボタンの場合は現在の地名を合成
        if (key === 'condition_summary_btn') {
            const isJa = i18n._currentLang === 'ja';
            const baseLabel = i18n.t(key).replace("📋 ", "");
            const icon = "📋 ";
            if (isJa) {
                el.innerHTML = `${icon}${currentLabel} ${baseLabel}`;
            } else {
                el.innerHTML = `${icon}${baseLabel} for ${currentLabel}`;
            }
        } else if (typeof i18n.dict[i18n._currentLang][key] === 'string') {
            // confirmDelete のような関数型データでない場合のみ text を置換
            el.innerHTML = i18n.t(key); // HTMLタグを含む場合があるため innerHTML を使用
        }
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
// 4.5 天気コード辞書（i18n対応）
// ==========================================
const weatherMaster = {
    0:  { ja: "快晴", en: "Clear sky" },
    1:  { ja: "晴れ", en: "Mainly clear" },
    2:  { ja: "晴れ時々曇り", en: "Partly cloudy" },
    3:  { ja: "曇り", en: "Overcast" },
    45: { ja: "霧", en: "Fog" },
    48: { ja: "着氷性の霧", en: "Depositing rime fog" },
    51: { ja: "霧雨（弱）", en: "Light drizzle" },
    53: { ja: "霧雨（中）", en: "Moderate drizzle" },
    55: { ja: "霧雨（強）", en: "Dense drizzle" },
    61: { ja: "小雨", en: "Slight rain" },
    63: { ja: "雨", en: "Moderate rain" },
    65: { ja: "大雨", en: "Heavy rain" },
    71: { ja: "小雪", en: "Slight snow fall" },
    73: { ja: "雪", en: "Moderate snow fall" },
    75: { ja: "大雪", en: "Heavy snow fall" },
    80: { ja: "にわか雨（弱）", en: "Slight rain showers" },
    81: { ja: "にわか雨（中）", en: "Moderate rain showers" },
    82: { ja: "にわか雨（強）", en: "Violent rain showers" },
    95: { ja: "雷雨", en: "Thunderstorm" }
};

/**
 * ヘルパー関数：天気コードから現在の言語の名称を取得
 */
function getI18nWeatherName(code) {
    const lang = i18n._currentLang === 'ja' ? 'ja' : 'en';
    return weatherMaster[code] ? weatherMaster[code][lang] : (lang === 'ja' ? "不明" : "Unknown");
}


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
//    {lat: 31.337, lon: 130.795, label: "高須沖(鹿児島県)"},
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
 * 新設サブルーチン：風速の単位変換ヘルパー
 * @param {number} value - 変換前の数値
 * @param {string} unit - ターゲットの単位 ('kn', 'kmh', 'mph', 'ms')
 * @param {boolean} reverse - trueなら「表示単位からm/s」へ逆算、falseなら「m/sから表示単位」へ変換
 */
function convertWindSpeedValue(value, unit, reverse = false) {
    const factors = {
        'kn': 1.94384,
        'kmh': 3.6,
        'mph': 2.23694,
        'ms': 1.0
    };
    const factor = factors[unit] || 1.0;
    return reverse ? (value / factor) : (value * factor);
}

/**
 * サブルーチン：詳細設定モーダルの初期化
 */
function initViewSettings() {
    const modal = document.getElementById('viewSettingsModal');
    const openBtn = document.getElementById('openSettingsBtn');
    const closeBtn = document.getElementById('closeViewSettings');
    const saveBtn = document.getElementById('saveViewSettings');
    const resetBtn = document.getElementById('resetViewSettings'); // リセットボタン

    if (!modal || !openBtn) return;

    const toggleBtn = document.getElementById('toggle-optional-settings');
    const optionalArea = document.getElementById('optional-settings');

    if (toggleBtn && optionalArea) {
        toggleBtn.addEventListener('click', () => {
            const isHidden = optionalArea.style.display === 'none';
            optionalArea.style.display = isHidden ? 'block' : 'none';
            if (typeof i18n !== 'undefined') {
                toggleBtn.innerText = isHidden ? i18n.t('btnOptionalClose') : i18n.t('btnOptionalOpen');
            } else {
                toggleBtn.innerText = isHidden ? 'オプション設定を閉じる ▲' : 'オプション設定 (表示倍率・サイズ等) ▼';
            }
        });
    }

    openBtn.addEventListener('click', () => {
        syncSliderValues();
        openModal('viewSettingsModal');
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            closeModal('viewSettingsModal');
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            saveViewSettings();
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            resetViewSettings();
        });
    }

    const configIds = ['hourWidth', 'windHeight', 'subHeight', 'margin', 'fontSize', 'iconScale', 'tooltipDuration', 'forecastDays'];
    configIds.forEach(id => {
        const input = document.getElementById(`input-${id}`);
        if (input) {
            input.oninput = () => {
                const valSpan = document.getElementById(`val-${id}`);
                if (valSpan) {
                    if (id === 'iconScale') valSpan.textContent = input.value;
                    else if (id === 'tooltipDuration') valSpan.textContent = input.value + "s";
                    else if (id === 'forecastDays') valSpan.textContent = input.value + "days";
                    else valSpan.textContent = input.value + "px";
                }
            };
        }
    });

    // --- 風速単位切り替え時の数値自動換算ロジック (整数統一版) ---
    const windUnitInput = document.getElementById('input-windUnit');
    if (windUnitInput) {
        let lastUnit = viewConfig.windSpeedUnit || 'ms';

        windUnitInput.addEventListener('change', () => {
            const nextUnit = windUnitInput.value;
            const thresholdUnitSpan = document.getElementById('val-windThresholds');
            
            if (thresholdUnitSpan) {
                thresholdUnitSpan.textContent = `(${windUnitInput.options[windUnitInput.selectedIndex].text})`;
            }

            const toMs = { 'ms': 1.0, 'kn': 0.514444, 'kmh': 0.277778, 'mph': 0.44704 };
            const fromMs = { 'ms': 1.0, 'kn': 1.94384, 'kmh': 3.6, 'mph': 2.23694 };

            const thIds = ['input-windThresholdHigh', 'input-windThresholdMid', 'input-windThresholdLow'];
            thIds.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    const currentVal = parseFloat(el.value);
                    if (!isNaN(currentVal)) {
                        let newVal = (currentVal * toMs[lastUnit]) * fromMs[nextUnit];
                        // 全ての単位において、四捨五入して整数にする
                        el.value = Math.round(newVal);
                    }
                }
            });
            
            lastUnit = nextUnit;
        });
    }
}

/**
 * 内部サブルーチン：現在の viewConfig の値をスライダーとラベルに反映させる
 */
function syncSliderValues() {
    const configIds = [
        'hourWidth', 'windHeight', 'subHeight', 'margin', 'fontSize', 
        'iconScale', 'tooltipDuration', 'forecastDays', 'tempUnit', 'windUnit',
        'windThresholdHigh', 'windThresholdMid', 'windThresholdLow'
    ];

    const windUnitInput = document.getElementById('input-windUnit');
    if (windUnitInput) {
        windUnitInput.value = viewConfig.windSpeedUnit;
        const thresholdUnitSpan = document.getElementById('val-windThresholds');
        if (thresholdUnitSpan) {
            const unitText = windUnitInput.options[windUnitInput.selectedIndex].text;
            thresholdUnitSpan.textContent = `(${unitText})`;
        }
    }

    configIds.forEach(id => {
        let configKey = id;
        if (id === 'margin') configKey = 'graphMargin';
        if (id === 'tempUnit') configKey = 'temperatureUnit';
        if (id === 'windUnit') configKey = 'windSpeedUnit';

        let val = viewConfig[configKey];
        if (id === 'forecastDays' && val === undefined) val = 9;

        const input = document.getElementById(`input-${id}`);
        if (input) {
            // 反映時も念のため整数に丸める
            if (id.includes('windThreshold')) {
                input.value = Math.round(val);
            } else {
                input.value = val;
            }
        }
        
        const valSpan = document.getElementById(`val-${id}`);
        if (valSpan) {
            if (id === 'iconScale') valSpan.textContent = val;
            else if (id === 'tooltipDuration') valSpan.textContent = val + "s";
            else if (id === 'forecastDays') valSpan.textContent = val + "days";
            else valSpan.textContent = val + "px";
        }
    });
}

/**
 * サブルーチン：設定の保存と適用
 */
async function saveViewSettings() {
    viewConfig.forecastDays = parseInt(document.getElementById('input-forecastDays').value);
    viewConfig.hourWidth = parseInt(document.getElementById('input-hourWidth').value);
    viewConfig.windHeight = parseInt(document.getElementById('input-windHeight').value);
    viewConfig.subHeight = parseInt(document.getElementById('input-subHeight').value);
    viewConfig.graphMargin = parseInt(document.getElementById('input-margin').value);
    viewConfig.fontSize = parseInt(document.getElementById('input-fontSize').value);
    viewConfig.iconScale = parseFloat(document.getElementById('input-iconScale').value);
    viewConfig.tooltipDuration = parseInt(document.getElementById('input-tooltipDuration').value);
    
    viewConfig.temperatureUnit = document.getElementById('input-tempUnit').value;
    viewConfig.windSpeedUnit = document.getElementById('input-windUnit').value;

    viewConfig.windThresholdHigh = Math.round(parseFloat(document.getElementById('input-windThresholdHigh').value));
    viewConfig.windThresholdMid = Math.round(parseFloat(document.getElementById('input-windThresholdMid').value));
    viewConfig.windThresholdLow = Math.round(parseFloat(document.getElementById('input-windThresholdLow').value));

    const savedSpots = localStorage.getItem('pin_weather_spots');
    let hasSpots = false;
    try {
        const parsed = JSON.parse(savedSpots);
        if (parsed && parsed.length > 0) hasSpots = true;
    } catch(e) { hasSpots = false; }

    if (!hasSpots) {
        await setApproximateLocation();
        const newSpot = { label: currentLabel, lat: currentLat, lon: currentLon };
        localStorage.setItem('pin_weather_spots', JSON.stringify([newSpot]));
    }

    localStorage.setItem('pin_weather_view_config', JSON.stringify(viewConfig));
    location.reload();
}

/**
 * サブルーチン：設定のリセット処理
 */
function resetViewSettings() {
    if (typeof showAppDialog === 'function') {
        showAppDialog({
            title: i18n.t('btnResetAll'),
            messageKey: 'confirmReset',
            onSave: () => {
                const resetData = JSON.parse(JSON.stringify(defaultViewConfig));
                Object.assign(viewConfig, resetData);
                localStorage.setItem('pin_weather_view_config', JSON.stringify(viewConfig));
                syncSliderValues();
                location.reload();
            }
        });
    }
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
 * サブルーチン：ウィジェットプレビューモーダルを開く
 * * 変更点（厳守事項）:
 * 1. 既存の地点(place), 座標(lat/lon), 風向(wind)の取得ロジックを完全維持。
 * 2. 5つのパラメータ（wUnit, tUnit, thH, thM, thL）をURLSearchParamsに厳密に追加。
 * 3. 構造化プログラミングに基づき、他のサブルーチンや変数への副作用を排除。
 */
function openWidgetPreview() {
    console.log("DEBUG: openWidgetPreview [START]");

    const titleArea = document.getElementById('common-modal-title');
    const msgArea = document.getElementById('common-modal-message');
    const widgetArea = document.getElementById('widget-preview-area');
    const iframe = document.getElementById('widget-preview-iframe');
    const codeArea = document.getElementById('widget-code-area');
    const copyBtnText = document.getElementById('widget-copy-btn-text');
    const modal = document.getElementById('app-common-modal');

    if (!modal) return;

    // 他のモーダル利用時に影響が出ないよう、一旦初期化（既存ロジックを継承）
    const allModalContents = modal.querySelectorAll('.modal-content-unit'); 
    allModalContents.forEach(el => el.style.display = 'none');

    // --- 1. タイトルとメッセージの表示 ---
    if (titleArea) {
        let titleText = "Widget Settings";
        if (typeof i18n !== 'undefined') {
            titleText = (typeof i18n.t === 'function') ? i18n.t('widgetTitle') : titleText;
        }
        titleArea.innerText = titleText;
        titleArea.style.display = 'block';
    }

    if (msgArea && typeof i18n !== 'undefined' && typeof i18n.t === 'function') {
        msgArea.innerText = i18n.t('widgetDesc');
        msgArea.style.display = 'block';
    }

    if (copyBtnText && typeof i18n !== 'undefined' && typeof i18n.t === 'function') {
        copyBtnText.innerText = i18n.t('widgetCopy');
    }

    // --- 2. パラメータの構成 ---
    const currentUrl = window.location.origin + window.location.pathname;
    const params = new URLSearchParams();
    params.set('mode', 'widget');

    // 地点名と座標のセット
    const placeName = (typeof currentLabel !== 'undefined') ? currentLabel : '';
    if (placeName) params.set('place', placeName);

    if (typeof currentLat !== 'undefined' && currentLat !== null) params.set('lat', currentLat);
    if (typeof currentLon !== 'undefined' && currentLon !== null) params.set('lon', currentLon);

    // 現在の色付け風向(targetWindDirections)の追加（既存仕様）
    if (typeof targetWindDirections !== 'undefined' && targetWindDirections.length > 0) {
        params.set('wind', targetWindDirections.join(','));
    }

    // --- 【重要】追加パラメータ：5つの表示設定 (viewConfigから取得) ---
    if (typeof viewConfig !== 'undefined') {
        // 風速単位・気温単位
        if (viewConfig.windSpeedUnit) params.set('wUnit', viewConfig.windSpeedUnit);
        if (viewConfig.temperatureUnit) params.set('tUnit', viewConfig.temperatureUnit);
        
        // 風速しきい値3種（数値の整合性を保つためMath.roundを適用）
        if (viewConfig.windThresholdHigh !== undefined) {
            params.set('thH', Math.round(viewConfig.windThresholdHigh));
        }
        if (viewConfig.windThresholdMid !== undefined) {
            params.set('thM', Math.round(viewConfig.windThresholdMid));
        }
        if (viewConfig.windThresholdLow !== undefined) {
            params.set('thL', Math.round(viewConfig.windThresholdLow));
        }
    }
    
    // URLの生成とiframe埋め込みコードの作成
    const widgetUrl = `${currentUrl}?${params.toString()}`;
    const embedCode = `<iframe src="${widgetUrl}" width="100%" height="660" frameborder="0" style="border:1px solid #eee; border-radius:8px;"></iframe>`;

    if (codeArea) codeArea.value = embedCode;

    // --- 3. プレビューエリアの表示制御 ---
    if (widgetArea) {
        widgetArea.style.display = 'block';
        widgetArea.style.height = "auto"; 
    }

    if (iframe) {
        iframe.src = widgetUrl;
    }

    const actionArea = document.getElementById('widget-action-area');
    if (actionArea) actionArea.style.display = 'block';

    // --- 4. モーダル本体の表示 ---
    modal.style.display = 'block';
    window.history.pushState({ page: 'modal', id: 'app-common-modal' }, "");
    
    console.log("DEBUG: openWidgetPreview [END]");
}

/**
 * サブルーチン：ウィジェットコードをコピー
 * ブラウザの標準alertを、汎用モーダル showAppDialog に置き換えています。
 */
function copyWidgetCode() {
    const area = document.getElementById("widget-code-area");
    if (area) {
        area.select();
        try {
            document.execCommand("copy");
            const msgTitle = (typeof i18n !== 'undefined') ? i18n.t('msgSaveComplete') : "Complete";
            const msgBody = (typeof i18n !== 'undefined') ? i18n.t('copySuccess') : "Copied!";
            
            // ブラウザ標準 alert(msgBody) から 汎用モーダルへ変更
            if (typeof showAppDialog === 'function') {
                showAppDialog({
                    title: msgTitle,
                    message: msgBody,
                    onSave: () => {} // 通知のみのため空関数
                });
            } else {
                alert(msgBody); // 万が一 showAppDialog が未定義の場合のフォールバック
            }
            
        } catch (err) {
            console.error("Copy failed:", err);
        }
    }
}

/**
 * サブルーチン：ウィジェット専用ヘッダーの自律生成（確定版）
 * グローバル変数ではなく、URLパラメータから直接値を抽出して表示します。
 */
function setupWidgetHeader() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') !== 'widget') return;

    // --- 修正ポイント：変数からではなく、URLから直接取得する ---
    const pPlace = urlParams.get('place');
    const pLat = urlParams.get('lat');
    const pLon = urlParams.get('lon');

    // 表示用の値を確定（デコード処理を含む）
    const displayLabel = pPlace ? decodeURIComponent(pPlace) : "";
    const latNum = pLat ? parseFloat(pLat).toFixed(3) : "";
    const lonNum = pLon ? parseFloat(pLon).toFixed(3) : "";

    // 二重表示防止
    const oldHeader = document.querySelector('.widget-only-header');
    if (oldHeader) oldHeader.remove();

    const header = document.createElement('div');
    header.className = 'widget-only-header';
    header.style.cssText = "padding: 10px 15px; background: #fff; border-bottom: 1px solid #eee; font-family: sans-serif; display: block; position: relative; z-index: 9999;";

    // HTMLの構築
    const coordsHtml = (latNum && lonNum) 
        ? `<span style="font-size:0.85em; color:#666; margin-left:10px; font-weight:normal;">${latNum}, ${lonNum}</span>` 
        : '';

    header.innerHTML = `<div style="font-weight:bold; color:#333; font-size:16px;"><span>${displayLabel}</span>${coordsHtml}</div>`;
    
    document.body.prepend(header);
}

/**
 * サブルーチン：環境判定とUIへの反映
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
            envName: "Beta"
        };
    } else {
        config = {
            titleSuffix: "",
            headerColor: "#00c8ff", 
            envName: "Main"
        };
    }

    const headerEl = document.querySelector('.control-wrapper');
    if (headerEl) {
        headerEl.style.backgroundColor = config.headerColor;
        headerEl.style.transition = "background-color 0.3s ease";
    }

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
 * 1. 【最優先】URLパラメータがあれば地点および「色付け風向(wind)」および「表示設定(Unit/Threshold)」を上書き
 * 2. 保存データがあればロード
 * 3. データがない場合はIPから現在地を推定して即時描画
 */
async function initApp() {
    console.log("DEBUG: App Init - Setting Home State");
    window.history.replaceState({ page: 'home' }, "");

    // --- 【重要】URLパラメータの解析 ---
    const urlParams = new URLSearchParams(window.location.search);
    const pMode = urlParams.get('mode');
    const pPlace = urlParams.get('place');
    const pLat = urlParams.get('lat');
    const pLon = urlParams.get('lon');
    const pWind = urlParams.get('wind');

    // --- 追加：ウィジェット用の表示設定パラメータ ---
    const pWUnit = urlParams.get('wUnit'); // 風速単位
    const pTUnit = urlParams.get('tUnit'); // 温度単位
    const pThH = urlParams.get('thH');     // しきい値(高)
    const pThM = urlParams.get('thM');     // しきい値(中)
    const pThL = urlParams.get('thL');     // しきい値(低)

    // ウィジェットモードかつ座標パラメータがある場合、ストレージより優先して適用
    let isParamLoaded = false;
    if (pMode === 'widget' && pLat && pLon) {
        currentLat = parseFloat(pLat);
        currentLon = parseFloat(pLon);
        currentLabel = pPlace ? decodeURIComponent(pPlace) : "Selected Location";
        
        // --- URLから色付け風向を復元 ---
        if (pWind) {
            const rawWindDirs = pWind.split(',');
            targetWindDirections = rawWindDirs.map(val => {
                if (typeof i18n !== 'undefined' && i18n._currentLang === 'en') {
                    if (typeof jaDirs !== 'undefined' && typeof enDirs !== 'undefined') {
                        const idx = jaDirs.indexOf(val);
                        return idx !== -1 ? enDirs[idx] : val;
                    }
                } else if (typeof i18n !== 'undefined') {
                    if (typeof jaDirs !== 'undefined' && typeof enDirs !== 'undefined') {
                        const idx = enDirs.indexOf(val);
                        return idx !== -1 ? jaDirs[idx] : val;
                    }
                }
                return val;
            });
            console.log("DEBUG: targetWindDirections restored from URL:", targetWindDirections);
        } else {
            targetWindDirections = [];
        }

        // --- 今回の修正：URLから表示設定(viewConfig)を復元 ---
        if (typeof viewConfig !== 'undefined') {
            if (pWUnit) viewConfig.windSpeedUnit = pWUnit;
            if (pTUnit) viewConfig.temperatureUnit = pTUnit;
            if (pThH !== null) viewConfig.windThresholdHigh = parseFloat(pThH);
            if (pThM !== null) viewConfig.windThresholdMid  = parseFloat(pThM);
            if (pThL !== null) viewConfig.windThresholdLow  = parseFloat(pThL);
            console.log("DEBUG: viewConfig updated from URL parameters:", viewConfig);
        }

        isParamLoaded = true;
        console.log("DEBUG: Location, Wind Filters, and View Config loaded from URL parameters.");
    }

    // --- ストレージの確認 ---
    const savedData = localStorage.getItem('pin_weather_spots');
    let parsedData = null;
    try {
        if (savedData) parsedData = JSON.parse(savedData);
    } catch (e) {
        parsedData = null;
    }

    // --- 地点確定ロジック（上書きガード付き） ---
    if (isParamLoaded) {
        finalizeInit(); 
    } else if (parsedData && parsedData.length > 0) {
        // ストレージにデータがある場合
        mySpots = parsedData;
        const lastSpot = mySpots[0];
        currentLat = lastSpot.lat;
        currentLon = lastSpot.lon;
        currentLabel = lastSpot.label;

        // 地点個別の風向設定があれば反映
        if (lastSpot.windFilters) {
            targetWindDirections = [...lastSpot.windFilters];
        } else {
            if (typeof jaDirs !== 'undefined') {
                targetWindDirections = [...jaDirs];
            }
        }

        finalizeInit(); 
    } else {
        // どちらもない場合（新規訪問）
        mySpots = [];
        await setApproximateLocation(); 
        
        if (typeof jaDirs !== 'undefined') {
            targetWindDirections = [...jaDirs];
        }
        
        finalizeInit();

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    console.log("GPS accuracy position acquired, but not overwriting current view.");
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
 * サブルーチン：共通の初期化プロセス
 */
function finalizeInit() {
// 【追加】ウィジェットモードならヘッダーを表示
    setupWidgetHeader();
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
 * 既存のユーザーデータ「pin_weather_spots」および「pin_weather_wind_filter」を厳守。
 * 「変更して登録」ボタンのクリックイベントが消失する問題を解決した修正版。
 */
function setupGeneralEvents() {
    // 1. 地図検索入力欄
    const searchInput = document.getElementById('map-search-input');
    if (searchInput) {
        searchInput.onkeypress = (e) => {
            if (e.key === 'Enter') executeMapSearch();
        };
    }
    
    // 2. 地図検索ボタン
    const searchBtn = document.getElementById('map-search-btn');
    if (searchBtn) searchBtn.onclick = executeMapSearch;
    
    // 3. 風向設定ボタン（サイドバー）
    const windCfgBtn = document.getElementById('wind-cfg-btn');
    if (windCfgBtn) {
        windCfgBtn.onclick = () => {
            if (typeof openModalFromSidebar === 'function') {
                openModalFromSidebar('wind-modal');
            } else {
                toggleSidebar();
                openModal('wind-modal');
            }
        };
    }
    
    // 4. 風向設定モーダル内のボタン群
    const applyWindBtn = document.getElementById('apply-wind-btn');
    if (applyWindBtn) {
        // 保存・適用処理（既存キー pin_weather_spots を厳守）
        const executeApply = () => {
            const currentSpot = mySpots.find(s => 
                Math.abs(s.lat - currentLat) < 0.0001 && 
                Math.abs(s.lon - currentLon) < 0.0001
            );

            if (currentSpot) {
                // 地点固有の設定を保存
                currentSpot.windFilters = [...targetWindDirections];
                // 【重要】既存のキー名 pin_weather_spots をそのまま使用
                localStorage.setItem('pin_weather_spots', JSON.stringify(mySpots));
            } else {
                // デフォルト設定用キー
                localStorage.setItem('pin_weather_wind_filter', JSON.stringify(targetWindDirections));
            }

            closeModal('wind-modal');
            draw(); // グラフ再描画
        };

        const footer = applyWindBtn.parentElement;
        if (footer && !document.getElementById('wind-helper-group')) {
            const helperGroup = document.createElement('div');
            helperGroup.id = 'wind-helper-group';
            helperGroup.style.display = 'flex';
            helperGroup.style.width = '100%';
            helperGroup.style.gap = '6px';
            helperGroup.style.marginTop = '4px';

            const baseBtnStyle = "padding: 8px 4px; border-radius: 6px; font-size: 11px; font-weight: 500; border: none; cursor: pointer; transition: opacity 0.2s; flex: 1; white-space: nowrap;";

            // ボタン1: デフォルトを読込（確認ダイアログ後にメモリ上の値を更新）
            const btnLoadDef = document.createElement('button');
            btnLoadDef.style.cssText = baseBtnStyle + "background: #f1f3f5; color: #495057;";
            btnLoadDef.innerText = i18n.t('btnLoadDefault');
            btnLoadDef.onclick = () => {
                showAppDialog({ 
                    title: i18n.t('msgLoadConfirmTitle') || "確認", 
                    message: i18n.t('msgLoadConfirmDesc') || "デフォルト設定を読み込みますか？", 
                    onSave: () => {
                        const savedDef = localStorage.getItem('pin_weather_wind_filter');
                        if (savedDef) {
                            let raw = JSON.parse(savedDef);
                            targetWindDirections = raw.map(val => {
                                if (i18n._currentLang === 'en') {
                                    const idx = jaDirs.indexOf(val); return idx !== -1 ? enDirs[idx] : val;
                                } else {
                                    const idx = enDirs.indexOf(val); return idx !== -1 ? jaDirs[idx] : val;
                                }
                            });
                            if (typeof initCompassUI === 'function') initCompassUI();
                        }
                    } 
                });
            };

            // ボタン2: デフォルトに保存（【修正済】確認ダイアログ表示後に保存を実行）
            const btnSaveDef = document.createElement('button');
            btnSaveDef.style.cssText = baseBtnStyle + "background: #f1f3f5; color: #495057;";
            btnSaveDef.innerText = i18n.t('btnSaveDefault');
            btnSaveDef.onclick = () => {
                // ここでは保存せず、ダイアログを表示するだけにする
                showAppDialog({ 
                    title: i18n.t('msgSaveConfirmTitle') || "保存の確認", 
                    message: i18n.t('msgSaveConfirmDesc') || "現在の設定をデフォルトとして保存しますか？", 
                    onSave: () => {
                        // ダイアログで「更新」が押された時のみ、ストレージを書き換える
                        localStorage.setItem('pin_weather_wind_filter', JSON.stringify(targetWindDirections));
                    } 
                });
            };

            // ボタン3: キャンセル
            const cancelBtn = document.createElement('button');
            cancelBtn.id = "btnClose"; 
            cancelBtn.style.cssText = baseBtnStyle + "background: #6c757d; color: white;";
            cancelBtn.innerText = i18n.t('btnClose') || "Cancel";
            cancelBtn.onclick = () => closeModal('wind-modal');

            // ボタン4: 適用（現在の地点に保存して再描画）
            const finalApplyBtn = document.createElement('button');
            finalApplyBtn.style.cssText = baseBtnStyle + "background: #007bff; color: white; flex: 1.2;";
            finalApplyBtn.innerText = i18n.t('btnSaveSettings') || "Apply Changes";
            finalApplyBtn.onclick = executeApply;

            // フッター再構築
            footer.innerHTML = ''; 
            footer.appendChild(btnLoadDef);
            footer.appendChild(btnSaveDef);
            footer.appendChild(cancelBtn);
            footer.appendChild(finalApplyBtn);
        }
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

    // 7. ご意見・ご要望ボタン
    const feedbackBtn = document.getElementById('feedback-btn');
    if (feedbackBtn) {
        feedbackBtn.onclick = () => {
            window.open("https://forms.gle/zdbaJNdodCMzcftK6", '_blank');
        };
    }

    // 8. プライバシーポリシー
    const privacyLink = document.getElementById('privacy-link');
    if (privacyLink) {
        privacyLink.onclick = (e) => {
            e.preventDefault();
            window.open("./privacy.html", '_blank');
        };
    }

    // 9. ウィジェットボタン
    const widgetBtn = document.getElementById('open-widget-modal-btn');
    if (widgetBtn) {
        widgetBtn.onclick = openWidgetPreview;
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
 * 修正内容：ウィジェット設定時は翻訳データを反映する処理を追加
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

    // 【追加】ウィジェット用モーダルの場合、表示テキストを辞書から取得してセット
    if (modalId === 'app-common-modal') {
        const titleArea = document.getElementById('common-modal-title');
        const msgArea = document.getElementById('common-modal-message');
        
        // i18n が利用可能な場合に翻訳を実行
        if (typeof i18n !== 'undefined') {
            if (titleArea) titleArea.innerText = i18n.t('widgetTitle');
            if (msgArea) msgArea.innerText = i18n.t('widgetDesc');
        } else {
            // 万が一のフォールバック
            if (titleArea) titleArea.innerText = "ウィジェット埋め込み設定";
            if (msgArea) msgArea.innerText = "あなたのサイトやブログに、この地点の気象グラフを埋め込むことができます。";
        }
    }

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

/**
 * サブルーチン：コンパスUIの初期化
 * 言語互換ロジックに基づき、現在の言語(targetWindDirections)と同期して描画する。
 */
function initCompassUI() {
    const container = document.getElementById('compass-ui');
    if (!container) return;

    // 最新の地点・デフォルト設定を読み込み（同期）
    syncWindFilterWithCurrentSpot();

    const radius = 130; 
    const centerX = 160; 
    const centerY = 160;

    // 中央ボタン（言語切り替え対応）
    const centerText = i18n._currentLang === 'ja' ? "全選択<br>解除" : "ALL";
    container.innerHTML = `<div class="compass-center">${centerText}</div>`;

    // windDirs は初期化時に現在の言語(jaDirs または enDirs)がセットされている
    windDirs.forEach((dir, i) => {
        const angle = (i * 22.5 - 90) * (Math.PI / 180);
        const x = centerX + radius * Math.cos(angle) - 30;
        const y = centerY + radius * Math.sin(angle) - 15;

        const el = document.createElement('div');
        
        // targetWindDirections に含まれているか判定
        // 言語互換ロジックにより targetWindDirections も現在の言語に変換されているため一致する
        const isActive = targetWindDirections.includes(dir);
        
        el.className = 'compass-label' + (isActive ? ' active' : '');
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.innerText = dir; // 現在の言語の文字列を表示
        
        el.onclick = () => {
            if (targetWindDirections.includes(dir)) {
                targetWindDirections = targetWindDirections.filter(d => d !== dir);
                el.classList.remove('active');
            } else {
                targetWindDirections.push(dir);
                el.classList.add('active');
            }
            console.log("DEBUG: Current wind selection:", targetWindDirections);
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
 * サブルーチン：環境色を反映した汎用ダイアログを表示（多言語・サイズ調整・安全版）
 * 1. ウィジェットプレビュー関連の要素をリセット。
 * 2. ホスト名に応じてヘッダー色を変更。
 * 3. 最後の1地点削除警告など、アクションがない場合でも「閉じる」ボタンを表示するよう修正。
 */
function showAppDialog({ title, message = null, messageKey = null, inputValue = null, onMap = null, onSave = null, onDelete = null }) {
    const modal = document.getElementById('app-common-modal');
    const header = document.getElementById('common-modal-header');
    const titleEl = document.getElementById('common-modal-title');
    const msgEl = document.getElementById('common-modal-message');
    const inputArea = document.getElementById('common-modal-input-area');
    const input = document.getElementById('common-modal-input');
    const footer = document.getElementById('common-modal-footer');

    // --- ウィジェット関連要素のリセット ---
    const widgetArea = document.getElementById('widget-preview-area');
    const widgetActionArea = document.getElementById('widget-action-area');
    if (widgetArea) widgetArea.style.display = 'none';
    if (widgetActionArea) widgetActionArea.style.display = 'none';

    if (!modal || !header || !titleEl || !msgEl || !footer) return;

    // 1. 環境色の反映
    const hostname = window.location.hostname;
    let bgColor = "#007bff"; 
    let textColor = "#ffffff";

    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.includes("192.168.")) {
        bgColor = "#b0fbcf"; 
        textColor = "#333333";
    } else if (hostname.includes("beta")) {
        bgColor = "#f5dc1b"; 
        textColor = "#333333";
    }

    header.style.backgroundColor = bgColor;
    titleEl.style.color = textColor;

    // 2. コンテンツのセット
    titleEl.innerText = title;
    if (messageKey) {
        msgEl.innerText = i18n.t(messageKey);
    } else if (message) {
        msgEl.innerText = message;
    } else {
        msgEl.innerText = "";
    }
    
    if (inputArea && input) {
        if (inputValue !== null) {
            inputArea.style.display = 'block';
            input.value = inputValue;
        } else {
            inputArea.style.display = 'none';
        }
    }

    // 3. ボタンの生成
    footer.innerHTML = "";
    
    // 【判定ロジックの修正】
    // ウィジェット設定画面（メッセージのみでタイトルが「ウィジェット埋め込み設定」）の場合はフッターを隠す。
    // それ以外（削除警告メッセージなど）は、アクションがなくても「閉じる」ボタンを出す。
    const isWidgetMode = (!onDelete && !onMap && !onSave && title === i18n.t('widgetTitle'));

    if (isWidgetMode) {
        footer.style.display = 'none';
    } else {
        footer.style.display = 'flex';

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

        // 地図ボタン
        if (onMap) {
            const btnMap = document.createElement('button');
            btnMap.className = "btn btn-map-view";
            btnMap.innerText = "Map"; 
            btnMap.onclick = () => {
                onMap();
                modal.style.display = 'none';
            };
            footer.appendChild(btnMap);
        }

        // キャンセル（閉じる）ボタン：ウィジェット以外では常に表示
        const btnCancel = document.createElement('button');
        btnCancel.className = "btn btn-secondary";
        btnCancel.innerText = i18n.t('btnClose');
        btnCancel.onclick = () => {
            modal.style.display = 'none';
        };
        footer.appendChild(btnCancel);

        // 保存・適用ボタン
        if (onSave) {
            const btnSave = document.createElement('button');
            btnSave.className = "btn btn-save";
            btnSave.innerText = i18n.t('btnApply') || i18n.t('btnSaveSettings') || "Update";
            btnSave.onclick = () => {
                const value = input ? input.value : null;
                onSave(value);
                modal.style.display = 'none';
            };
            footer.appendChild(btnSave);
        }
    }

    modal.style.display = 'flex';
}

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
 * サブルーチン：地点の削除確認（自作ダイアログ版）
 */
function confirmDeleteByLabel(label) {
    if (!label) return;

    const index = mySpots.findIndex(s => s.label === label);
    if (index === -1) return;

    // 1. 最後の1件チェック
    if (mySpots.length <= 1) {
        showAppDialog({
            title: label,
            messageKey: 'lastSpotWarning',
            onSave: null
        });
        return;
    }

    // 2. 削除確認
    const confirmMessage = i18n.t('confirmDelete', { name: label });

    showAppDialog({
        title: i18n.t('confirmDeletePrefix') + " " + label,
        message: confirmMessage,
        messageKey: null,
        onSave: () => {
            const finalIdx = mySpots.findIndex(s => s.label === label);
            if (finalIdx > -1) {
                // 配列から削除
                mySpots.splice(finalIdx, 1);
                localStorage.setItem('pin_weather_spots', JSON.stringify(mySpots));
                
                // 削除した地点を表示し続けると「未登録地点」としてタブに残るため、
                // 残ったリストの最初の地点に切り替えて再描画します。
                const nextSpot = mySpots[0];
                if (nextSpot) {
                    updateLocation(nextSpot.lat, nextSpot.lon, nextSpot.label);
                    renderTabs(nextSpot.label);
                } else {
                    renderTabs();
                }
            }
        }
    });
}

/**
 * サブルーチン：地点タブの描画
 */
function renderTabs(activeOverrideLabel = null) {
    const container = document.getElementById('spot-tabs');
    if (!container) return;
    container.innerHTML = "";

    if (mySpots.length > 10) {
        mySpots = mySpots.slice(0, 10);
        localStorage.setItem('pin_weather_spots', JSON.stringify(mySpots));
    }

    const activeLabel = activeOverrideLabel || currentLabel;
    const activeIdx = mySpots.findIndex(s => s.label === activeLabel);
    let displaySpots = [...mySpots];
    let activeSpot = null;
    let isExternalSpot = false;

    // アクティブ地点の判定
    if (activeIdx > -1) {
        activeSpot = displaySpots.splice(activeIdx, 1)[0];
    } else if (activeLabel && !['gps', 'map', 'GPS', 'Map'].includes(activeLabel)) {
        // 保存リストにない場合は「未登録地点」として扱う
        isExternalSpot = true;
        activeSpot = { label: activeLabel, lat: currentLat, lon: currentLon };
    }

    let items = [];
    if (activeSpot) {
        items.push({ id: activeSpot.label, label: isExternalSpot ? activeSpot.label : `📍 ${activeSpot.label}`, lat: activeSpot.lat, lon: activeSpot.lon, rawLabel: activeSpot.label, isExternal: isExternalSpot });
    }
    items.push({ id: 'gps', label: 'GPS', isSpecial: true, isExternal: true });
    items.push({ id: 'map', label: 'Map', isSpecial: true, isExternal: true });
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

        if (!item.isSpecial) {
            const openEditor = (e) => {
                if (e) { e.preventDefault(); e.stopPropagation(); }
                const currentLabelAtOpen = item.rawLabel;

                showAppDialog({
                    title: currentLabelAtOpen,
                    messageKey: 'editSpotGuide',
                    inputValue: currentLabelAtOpen,
                    onMap: () => { if (typeof openMap === 'function') openMap(item.lat, item.lon); },
                    onSave: (newName) => {
                        if (!newName || (typeof checkSpotLimit === 'function' && !checkSpotLimit(newName))) return;
                        const idx = mySpots.findIndex(s => s.label === currentLabelAtOpen);
                        if (idx !== -1) {
                            const targetSpot = mySpots.splice(idx, 1)[0];
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
                    onDelete: !item.isExternal ? () => {
                        setTimeout(() => {
                            confirmDeleteByLabel(currentLabelAtOpen);
                        }, 50);
                    } : null
                });
            };
            btn.oncontextmenu = openEditor; 
            let timer;
            btn.ontouchstart = (e) => { timer = setTimeout(() => openEditor(e), 800); }; 
            btn.ontouchend = () => clearTimeout(timer); 
        }
        container.appendChild(btn);
    });
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
 * 背景固定の解除処理を追加しました。
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
    
    // 背景固定を解除し、スクロールを有効にする
    document.body.style.overflow = '';

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
 * 背景固定の解除処理を追加しました。
 */
function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal && modal.style.display === 'block') {
        modal.style.display = 'none';
        
        // 背景固定を解除してスクロール可能にする
        document.body.style.overflow = '';
        console.log("DEBUG: Modal closed, body scroll restored.");
        
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

function onMapClick(e) {
    const { lat, lng } = e.latlng;
    
    // 【DEBUG】クリックされた瞬間の座標を記録
    console.log(`[DEBUG] Map Clicked: lat=${lat}, lon=${lng}`);

    currentLat = lat;
    currentLon = lng;

    if (tempMarker) {
        tempMarker.setLatLng(e.latlng);
    } else {
        tempMarker = L.marker(e.latlng).addTo(map);
    }

    // 住所取得。この後に currentLabel がどう変わるかが重要
    if (typeof fetchAddressInfo === 'function') {
        fetchAddressInfo(currentLat, currentLon);
    }
}

/**
 * サブルーチン：座標から住所情報を取得し、モーダル内のボタンに機能を割り当てる
 * グラフ表示時は1番目タブに地名を挿入し、内部座標(currentLat/Lon)を同期させます。
 */
async function fetchAddressInfo(lat, lng) {
    console.log(`[DEBUG] fetchAddressInfo started: lat=${lat}, lon=${lng}`);

    const statusEl = document.getElementById('map-status');
    if (statusEl) statusEl.innerText = i18n.t('mapStatusFetching');
    
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=${i18n._currentLang}`);
        const data = await res.json();
        
        console.log(`[DEBUG] Address Data:`, data.address);

        const addr = data.address;
        const city = addr.city || addr.town || addr.village || "";
        const district = addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || "";
        const defaultName = (city + district) || i18n.t('mapNewSpot');

        // --- 「MySpotsに登録」ボタンの制御 (既存ロジックを維持) ---
        const saveSpotBtn = document.getElementById('save-spot-btn');
        if (saveSpotBtn) {
            saveSpotBtn.onclick = () => {
                showAppDialog({
                    title: defaultName,
                    messageKey: 'mapSavePrompt',
                    inputValue: defaultName,
                    onSave: (spotName) => {
                        if (!spotName) return;
                        if (!checkSpotLimit(spotName)) return;

                        const filtered = mySpots.filter(s => s.label !== spotName);
                        mySpots = [{ lat, lon: lng, label: spotName }, ...filtered];
                        localStorage.setItem('pin_weather_spots', JSON.stringify(mySpots));
                        
                        // 描画とタブ更新
                        updateLocation(lat, lng, spotName);
                        renderTabs(spotName); 
                        closeModal('map-modal');
                    }
                });
            };
            saveSpotBtn.disabled = false;
        }

        // --- 「グラフ表示」ボタンの制御 (要件に基づき新規実装) ---
        const tempViewBtn = document.getElementById('temp-view-btn');
        if (tempViewBtn) {
            tempViewBtn.onclick = () => {
                console.log(`[DEBUG] Temp Graph View: ${defaultName} (lat:${lat}, lon:${lng})`);
                
                // 1. 内部変数を📌地点の座標とラベルで更新
                // これにより Map ボタンを押した際もこの地点が開かれるようになります
                currentLat = lat;
                currentLon = lng;
                currentLabel = defaultName;

                // 2. 提供された updateLocation を実行（描画処理）
                updateLocation(lat, lng, defaultName);

                // 3. 提供された renderTabs を実行
                // activeOverrideLabel として defaultName を渡すことで、
                // mySpotsには保存せず「1番目のタブ」にこの地名を挿入・表示させます
                renderTabs(defaultName); 

                // 4. モーダルを閉じる
                closeModal('map-modal');
            };
            tempViewBtn.disabled = false;
        }
        
        if (statusEl) statusEl.innerText = "📍：" + defaultName;
    } catch (err) {
        console.error("[DEBUG] fetchAddressInfo Error:", err);
        if (statusEl) statusEl.innerText = i18n.t('mapStatusFail');
    }
}

/**
 * サブルーチン：現在地の更新と描画
 * 地名が変わるたびにボタン内の地名表示エリアのみを書き換えます。
 */
async function updateLocation(lat, lon, label) {
    const timerLabel = `📊 描画所要時間 [${label}]`;    
    console.time(timerLabel);
    
    currentLat = lat; 
    currentLon = lon; 
    currentLabel = label;

    // --- コンディション概況ボタンの地名部分のみを更新 ---
    const locationSpan = document.getElementById('summary-btn-location');
    if (locationSpan) {
        const isJa = i18n._currentLang === 'ja';
        // 日本語なら「地名 」、英語なら「for 地名」のように調整可能
        if (isJa) {
            locationSpan.innerText = label + " ";
        } else {
            locationSpan.innerText = "for " + label;
        }
    }

    try {
        // 実際の描画処理
        await draw(); 
    } catch (err) {
        console.error(`描画エラー [${label}]:`, err);
    } finally {
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
    console.time("  => Sub: Cache Check/Read"); // 【計測】キャッシュ処理開始
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
                console.timeEnd("  => Sub: Cache Check/Read"); // キャッシュヒットで終了
                return { timestamp: parsed.timestamp, data: parsed.data };
            } else {
                // 期限切れ、リロード、または設定（日数・単位）変更ならキャッシュを消去
                localStorage.removeItem(cacheKey);
            }
        } catch (e) {
            localStorage.removeItem(cacheKey);
        }
    }
    console.timeEnd("  => Sub: Cache Check/Read"); // キャッシュミスまたは無効で終了

    // API取得（forecast_days, temperature_unit, wind_speed_unit を動的に設定）
    const wUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,wind_speed_10m,wind_direction_10m,weather_code,precipitation&timezone=auto&forecast_days=${fDays}&temperature_unit=${tUnit}&wind_speed_unit=${wUnit}`;
    const mUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&hourly=wave_height,sea_surface_temperature,sea_level_height_msl&timezone=auto&forecast_days=${fDays}&temperature_unit=${tUnit}&cell_selection=sea`;

    console.time("  => Sub: Total API Fetch Time"); // 【計測】並列処理全体の開始
    try {
        const [wRes, mRes] = await Promise.all([
            (async () => {
                console.time("    -> API 1: Weather Fetch"); // 【計測】気象API開始
                const res = await fetch(wUrl).then(r => { if(!r.ok) throw new Error(); return r.json(); });
                console.timeEnd("    -> API 1: Weather Fetch"); // 【計測】気象API終了
                return res;
            })(),
            (async () => {
                console.time("    -> API 2: Marine Fetch"); // 【計測】海洋API開始
                const res = await fetch(mUrl).then(r => { if(!r.ok) throw new Error(); return r.json(); });
                console.timeEnd("    -> API 2: Marine Fetch"); // 【計測】海洋API終了
                return res;
            })()
        ]);
        console.timeEnd("  => Sub: Total API Fetch Time"); // 【計測】並列処理全体の終了

        console.time("  => Sub: Merging & Storage"); // 【計測】データ保存処理
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
        console.timeEnd("  => Sub: Merging & Storage");
        
        return cacheData;

    } catch (error) {
        console.timeEnd("  => Sub: Total API Fetch Time");
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

/**
 * 現在の地点またはデフォルトから風向設定を同期する。
 * 保存されているデータ形式を現在の言語に合わせて変換する。
 * ただし、ウィジェットモードでURLから設定済みの場合は上書きしない。
 */
function syncWindFilterWithCurrentSpot() {
    // 【重要】URLパラメータから既に設定されている（isWidgetMode等のフラグ、
    //  またはtargetWindDirectionsに値がある）場合は、同期処理をスキップして終了する。
    if (typeof isWidgetMode !== 'undefined' && isWidgetMode && targetWindDirections.length > 0) {
        console.log("DEBUG: Skip syncWindFilter (Widget mode with URL params)");
        return;
    }

    const currentSpot = mySpots.find(s => 
        Math.abs(s.lat - currentLat) < 0.0001 && 
        Math.abs(s.lon - currentLon) < 0.0001
    );

    let baseData = [];

    if (currentSpot && currentSpot.windFilters && currentSpot.windFilters.length > 0) {
        baseData = [...currentSpot.windFilters];
    } else {
        const savedDef = localStorage.getItem('pin_weather_wind_filter');
        if (savedDef) {
            baseData = JSON.parse(savedDef);
        } else {
            // 設定がない場合は現在の言語の全方位をセット
            // windDirs が未定義の場合のエラーを避けるため、jaDirs等を参照
            if (typeof windDirs !== 'undefined') {
                targetWindDirections = [...windDirs];
            } else if (typeof jaDirs !== 'undefined') {
                targetWindDirections = [...jaDirs];
            }
            return;
        }
    }

    // 言語互換ロジックを適用して変換
    targetWindDirections = baseData.map(val => {
        if (typeof i18n !== 'undefined' && i18n._currentLang === 'en') {
            const idx = jaDirs.indexOf(val);
            return idx !== -1 ? enDirs[idx] : val;
        } else {
            const idx = enDirs.indexOf(val);
            return idx !== -1 ? jaDirs[idx] : val;
        }
    });
    
    console.log("DEBUG: Synced targetWindDirections", targetWindDirections);
}

/**
 * サブルーチン：コンディション概況エリアまでスムーズにスクロールする
 */
function scrollToSummary() {
    const target = document.getElementById('weather-summary-container');
    if (target) {
        // スムーズスクロール。block: 'start' で要素の先頭を画面上部に合わせる
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

/**
 * ヘルパー関数：角度から現在の言語に合わせた16方位の名称を取得
 * セクション4の jaDirs, enDirs と同期
 */
function getAzimuth(degrees) {
    const index = Math.round(degrees / 22.5) % 16;
    const currentDirs = i18n._currentLang === 'ja' ? jaDirs : enDirs;
    return currentDirs[index];
}

/**
 * サブルーチン：気象データから概況文章を生成
 * 天気の変化を具体的に（晴れ・曇り・雨など）記述するように拡張
 */
function generateWeatherSummary(data, label) {
    // データ異常系チェック
    if (!data || !data.time || !data.weather_code || !data.wind_speed_10m) {
        return typeof i18n !== 'undefined' ? i18n.t('analyzing') : "Analyzing...";
    }

    const isJa = typeof i18n !== 'undefined' && i18n._currentLang === 'ja';

    // 1. 現在時刻（描画時刻）を取得
    const now = new Date();
    
    // 2. 解析用の基準インデックスを特定
    let nowIdx = 0;
    let minDiff = Infinity;
    for (let i = 0; i < data.time.length; i++) {
        const diff = Math.abs(new Date(data.time[i]) - now);
        if (diff < minDiff) {
            minDiff = diff;
            nowIdx = i;
        }
    }

    // 3. 時刻ヘッダーの生成
    const dateStr = getLocalizedDate(now);
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');

    let timeHeader = isJa 
        ? `${label}：${dateStr} ${hours}:${minutes}` 
        : `${label}: ${dateStr} ${hours}:${minutes}`;

    const targetHours = 24;
    const endIdx = Math.min(nowIdx + targetHours, data.time.length - 1);

    // 単位の設定
    const wUnit = (typeof viewConfig !== 'undefined') ? 
                (viewConfig.windSpeedUnit === 'kn' ? 'kn' : 
                viewConfig.windSpeedUnit === 'kmh' ? 'km/h' : 
                viewConfig.windSpeedUnit === 'mph' ? 'mph' : 'm/s') : 'm/s';

    const tUnit = (typeof viewConfig !== 'undefined' && viewConfig.temperatureUnit === 'fahrenheit') ? '℉' : '℃';

    // --- 1. 天気と気温の解析 ---
    const currentCode = data.weather_code[nowIdx];
    const currentWeatherName = getI18nWeatherName(currentCode);
    
    // 天気グループ判定ヘルパー
    const getGroup = (code) => {
        if ([0, 1].includes(code)) return 'clear';
        if ([2, 3, 45, 48].includes(code)) return 'cloud';
        if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return 'rain';
        if ([71, 73, 75, 85, 86].includes(code)) return 'snow';
        if ([95, 96, 99].includes(code)) return 'thunder';
        return 'other';
    };

    const currentGroup = getGroup(currentCode);
    let changeIdx = -1;
    let nextGroup = '';

    for (let i = nowIdx + 1; i <= endIdx; i++) {
        const targetGroup = getGroup(data.weather_code[i]);
        if (targetGroup !== currentGroup) {
            changeIdx = i;
            nextGroup = targetGroup;
            break;
        }
    }

    // 気温データの抽出
    const rawTemps = data.temperature_2m.slice(nowIdx, endIdx + 1).filter(v => v !== null && typeof v === 'number');
    let tempPart = "";
    let weatherFinal = i18n.t('weather_now').replace('{weather}', currentWeatherName);

    if (changeIdx !== -1) {
        const cTime = new Date(data.time[changeIdx]);
        const dayLabel = cTime.getDate() !== now.getDate() ? i18n.t('tomorrow') : "";
        
        // 変化後の状態（status）を決定
        const statusKey = `status_${nextGroup}`;
        const statusText = i18n.t(statusKey);

        weatherFinal += i18n.t('weather_change')
            .replace('{day}', dayLabel)
            .replace('{time}', cTime.getHours())
            .replace('{status}', statusText);
    } else {
        weatherFinal += i18n.t('stable_weather');
    }

    if (rawTemps.length > 0) {
        const maxTemp = Math.max(...rawTemps);
        const minTemp = Math.min(...rawTemps);
        const tempDiff = maxTemp - minTemp;
        tempPart = i18n.t('temp_info')
            .replace('{max}', maxTemp.toFixed(1))
            .replace('{min}', minTemp.toFixed(1))
            .replaceAll('{unit}', tUnit);
        tempPart += (tempDiff >= 10) ? i18n.t('temp_diff_warn') : i18n.t('temp_stable');
    }
    weatherFinal += tempPart;

    // --- 2. 風向・風速の解析 ---
    const currentWindSpeed = data.wind_speed_10m[nowIdx];
    const currentWindDir = getAzimuth(data.wind_direction_10m[nowIdx]);
    const rawWinds = data.wind_speed_10m.slice(nowIdx, endIdx + 1).filter(v => v !== null && typeof v === 'number');

    let windFinal = "";
    if (currentWindSpeed !== null && typeof currentWindSpeed === 'number') {
        windFinal = i18n.t('wind_current')
            .replace('{dir}', currentWindDir)
            .replace('{speed}', currentWindSpeed.toFixed(1))
            .replace('{unit}', wUnit);

        if (rawWinds.length > 0) {
            const maxWind = Math.max(...rawWinds);
            if (maxWind - currentWindSpeed >= 3) {
                const maxWindIdx = nowIdx + data.wind_speed_10m.slice(nowIdx, endIdx + 1).indexOf(maxWind);
                const mTime = new Date(data.time[maxWindIdx]);
                const dayLabel = mTime.getDate() !== now.getDate() ? i18n.t('tomorrow') : "";
                const mWindDir = getAzimuth(data.wind_direction_10m[maxWindIdx]);
                windFinal += i18n.t('wind_strengthen')
                    .replace('{day}', dayLabel)
                    .replace('{time}', mTime.getHours())
                    .replace('{maxDir}', mWindDir)
                    .replace('{maxSpeed}', maxWind.toFixed(1))
                    .replace('{unit}', wUnit);
            } else {
                windFinal += i18n.t('wind_stable').replace('{dir}', currentWindDir);
            }
        }
    }

    // --- 3. 波の解析 ---
    let waveFinal = "";
    if (data.wave_height && data.wave_height[nowIdx] !== null) {
        const currentWave = data.wave_height[nowIdx];
        const futureWave = data.wave_height[endIdx];
        if (typeof currentWave === 'number' && typeof futureWave === 'number') {
            const waveDiff = futureWave - currentWave;
            waveFinal = i18n.t('wave_current').replace('{current}', currentWave.toFixed(2));
            if (waveDiff >= 0.3) {
                waveFinal += i18n.t('wave_rise').replace('{future}', futureWave.toFixed(2));
            } else if (waveDiff <= -0.3) {
                waveFinal += i18n.t('wave_fall').replace('{future}', futureWave.toFixed(2));
            } else {
                waveFinal += i18n.t('wave_stable');
            }
        }
    }

    let title = i18n.t('summary_title');
    return `${title} ${timeHeader} ${i18n.t('as_of')}\n${weatherFinal}\n${windFinal}\n${waveFinal}`;
}

// ツールチップ消去用タイマー変数
let tooltipTimer = null;

/**
 * メインサブルーチン：描画処理
 */
async function draw() {
    console.time("Total Draw Process"); // 【計測】全体開始
    
    // 描画の直前に、現在の地点に合わせた風向設定を読み込む
    syncWindFilterWithCurrentSpot();

    try {
        if (typeof currentLat === 'undefined' || currentLat === null || typeof currentLon === 'undefined' || currentLon === null) {
            console.warn("Location coordinates are undefined. Redirecting to initApp...");
            if (typeof initApp === 'function') { await initApp(); }
            return;
        }

        const params = new URLSearchParams(window.location.search);
        const isWidget = params.get('mode') === 'widget';
        
        // --- 1. ウィジェットモード時のパラメータ反映（確実に最新を反映） ---
        if (isWidget) {
            if (params.get('tUnit')) viewConfig.temperatureUnit = params.get('tUnit');
            if (params.get('wUnit')) viewConfig.windSpeedUnit = params.get('wUnit');
            if (params.get('thH') !== null) viewConfig.windThresholdHigh = parseFloat(params.get('thH'));
            if (params.get('thM') !== null) viewConfig.windThresholdMid  = parseFloat(params.get('thM'));
            if (params.get('thL') !== null) viewConfig.windThresholdLow  = parseFloat(params.get('thL'));

            // ナビ表示制御
            const nav = document.querySelector('.nav-container') || document.querySelector('nav');
            if (nav) nav.style.display = 'none';
        }

        // --- 2. 【重要】反映されない単位テキストの再計算と辞書の更新 ---
        const currentWUnit = viewConfig.windSpeedUnit === 'ms' ? 'm/s' : (viewConfig.windSpeedUnit === 'kmh' ? 'km/h' : viewConfig.windSpeedUnit);
        const currentTUnit = viewConfig.temperatureUnit === 'celsius' ? '℃' : '℉';

        // i18n辞書の動的プロパティを現在の設定で上書き（ツールチップ等に反映）
        if (typeof i18n !== 'undefined' && i18n.dict[i18n._currentLang]) {
            i18n.dict[i18n._currentLang].speedunit = currentWUnit;
        }
        // -----------------------------------------------------------
        
        console.time("1. Data Fetch (Cache)"); // 【計測】データ取得
        allData = await fetchWithCache(currentLat, currentLon);
        if (allData) {
            const summaryText = generateWeatherSummary(allData.data, currentLabel);
            const el = document.getElementById('weather-summary');
            if (el) {
                el.innerText = summaryText;
            }
        }
        console.timeEnd("1. Data Fetch (Cache)");

        const svgW = document.getElementById('svg-weather');
        if (!svgW || !allData || !allData.data) return;

        console.time("2. Layout Setup"); // 【計測】計算とレイアウト設定
        
        const currentSpot = mySpots.find(s => 
            Math.abs(s.lat - currentLat) < 0.0001 && 
            Math.abs(s.lon - currentLon) < 0.0001
        );
        
        const activeWindFilters = (currentSpot && currentSpot.windFilters) 
            ? currentSpot.windFilters 
            : targetWindDirections;

        const drawReferenceTime = new Date();
        const totalDataCount = allData.data.time.length;
        const baseWindIcon = `<svg width="14" height="14" viewBox="-8 -15 16 20" style="vertical-align:middle; margin-right:2px; display:inline-block;"><path d="M0,-12 L6,6 L0,2 L-6,6 Z" fill="#00d4ff" stroke="#008eb3" stroke-width="1" transform="rotate(-90)"/></svg>`;

        const fullIdx = allData.data.time.findIndex(t => new Date(t) > drawReferenceTime) - 1;
        const startIdx = Math.max(0, fullIdx - 4);
        
        const hScale = viewConfig.hourWidth; 
        const displayCount = totalDataCount - startIdx;

        let windH = isWidget ? 80 : viewConfig.windHeight;
        let subH = isWidget ? 80 : viewConfig.subHeight;
        let gMargin = viewConfig.graphMargin || 0;

        // --- 3. y軸ラベルの動的更新（i18n辞書の固定値を使わず現在のUnit変数を使用） ---
        const titles = document.querySelectorAll('.y-axis-title');
        if (titles.length >= 4) {
            titles[0].innerHTML = i18n.t('yAxisWeather');
            titles[1].innerHTML = `${baseWindIcon}${i18n.t('windDir')}<br>(${currentWUnit})`;
            titles[2].innerHTML = `${i18n.t('temp')}(${currentTUnit})<br>${i18n.t('seawater')}(${currentTUnit})`;
            
            const waveData = allData.data.wave_height ? allData.data.wave_height.slice(startIdx) : [];
            const tideData = allData.data.sea_level_height_msl ? allData.data.sea_level_height_msl.slice(startIdx) : [];
            const hasMarineData = waveData.some(v => v !== 0 && v !== null) || tideData.some(v => v !== 0 && v !== null);
            
            let marineTitle = hasMarineData ? i18n.t('yAxisMarine') : `<br><span style="color:#FF0000; font-weight:bold; font-size:14px; display:block; margin-top:2px;">No Marine Data</span>`;
            titles[3].innerHTML = marineTitle;
        }

        const labelFS = viewConfig.fontSize;
        const iScale = viewConfig.iconScale;
        const totalW = hScale * (displayCount - 1);

        const secWind = document.querySelector('.section-wind');
        const secTemp = document.querySelector('.section-temp');
        const secMarine = document.querySelector('.section-marine');
        const sections = [document.querySelector('.section-weather'), secWind, secTemp, secMarine];
        
        sections.forEach(sec => { if(sec) sec.style.width = totalW + "px"; });

        if (secWind) { secWind.style.height = windH + "px"; secWind.style.marginBottom = gMargin + "px"; }
        if (secTemp) { secTemp.style.height = subH + "px"; secTemp.style.marginBottom = gMargin + "px"; }
        if (secMarine) { 
            secMarine.style.height = subH + "px"; 
            secMarine.style.marginBottom = "0px"; 
        }
        console.timeEnd("2. Layout Setup");

        // --- 4. Weather Icon & Rain View 以降の描画ロジックを維持 ---
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
        
        // セクションレンダリング
        renderSection("svg-wind", "date-wind", [{ data: allData.data.wind_speed_10m, type: 'bar' }], windH, 5.0, true, false, true, startIdx, hScale, totalW, labelFS, iScale, totalDataCount, drawReferenceTime, activeWindFilters);
        
        const hasMarineData = (allData.data.wave_height && allData.data.wave_height.slice(startIdx).some(v => v !== 0 && v !== null));
        renderSection("svg-temps", "date-temp", [{ data: allData.data.temperature_2m, type: 'line', cls: 'line-temp-air' }, { data: allData.data.sea_surface_temperature, type: 'line', cls: 'line-temp-sea' }], subH, 5.0, false, !hasMarineData, false, startIdx, hScale, totalW, labelFS, iScale, totalDataCount, drawReferenceTime, null);
        
        if (hasMarineData) {
            renderSection("svg-marine", "date-marine", [{ data: allData.data.wave_height, type: 'line', cls: 'line-wave' }, { data: allData.data.sea_level_height_msl, type: 'line', cls: 'line-tide' }], subH, 0.5, false, true, false, startIdx, hScale, totalW, labelFS, iScale, totalDataCount, drawReferenceTime, null);
        }

        updateWindLegend();
        resetGraphScroll();
        initScrollEvent(hScale, startIdx);
        initTooltipEvent(startIdx, hScale, totalW, labelFS, drawReferenceTime);

        console.timeEnd("Total Draw Process");
    } catch (e) { 
        console.error("Critical Draw Error:", e);
    }
}

/**
 * サブルーチン：セクション（グラフエリア）のレンダリング
 * 言語設定に関わらず、保存された風向フィルタを正しく適用する修正版。
 */
function renderSection(svgId, dateContId, datasets, height, stepY, isWind, isLast, isFirst, startIdx, hScale, totalW, labelFS, iScale, totalDataCount, drawReferenceTime, activeWindFilters) {
    const svg = document.getElementById(svgId);
    const dateCont = document.getElementById(dateContId);
    const dateTop = document.getElementById('date-top');
    const timeTop = document.getElementById('time-top');
    const valCont = document.getElementById(`val-${svgId}`);

    if (!svg || !dateCont) return;

    const allVals = datasets.flatMap(ds => ds.data ? ds.data.slice(startIdx) : [])
                            .filter(v => typeof v === 'number' && !isNaN(v));
    if (allVals.length === 0) return;
    
    let max = Math.ceil(Math.max(...allVals) / stepY) * stepY;
    let min = Math.floor(Math.min(...allVals) / stepY) * stepY;
    if (isWind) min = 0;

    if (valCont) {
        valCont.innerHTML = `<div class="y-max">${max.toFixed(isWind ? 0 : 1)}</div><div class="y-min">${min.toFixed(isWind ? 0 : 1)}</div>`;
    }
    const range = (max - min) || 1;
    const plotHeight = height - 20; 
    
    let html = "";
    let dateContHtml = "";
    let dateTopHtml = "";
    let timeTopHtml = "";

    // グリッド（Y軸）
    for (let v = min; v <= max; v += stepY) {
        const yPosSvg = plotHeight - (((v - min) / range) * plotHeight);
        html += `<line x1="0" y1="${yPosSvg}" x2="${totalW}" y2="${yPosSvg}" class="grid-y-sub" />`;
    }

    // グリッド（X軸・時間）
    for (let i = startIdx; i < totalDataCount; i++) {
        const x = (i - startIdx) * hScale;
        const d = new Date(allData.data.time[i]);
        if (i % 24 === 0 || i === startIdx) {
            html += `<line x1="${x}" y1="0" x2="${x}" y2="${plotHeight}" class="grid-day" />`;
            const dayIdx = d.getDay();
            let dayColor = (dayIdx === 0) ? "#FF0000" : (dayIdx === 6 ? "#0000FF" : "#000000");
            const localizedDateStr = getLocalizedDate(d);
            const labelContent = `<span style="color:${dayColor}; font-size:${labelFS * 1.5}px;" class="notranslate">${localizedDateStr}</span>`;
            dateContHtml += `<div class="sticky-date-bottom" style="left:${x}px;" data-x="${x}">${isLast ? labelContent : ''}</div>`;
            if (isFirst && dateTop) dateTopHtml += `<div class="sticky-date-top" style="left:${x}px;" data-x="${x}">${labelContent}</div>`;
        }
        if (i % 3 === 0 || i % 24 === 0) {
            if (isFirst && timeTop) {
                timeTopHtml += `<div style="position:absolute; left:${x}px; transform:translateX(-50%);" data-x="${x}"><span class="label-time" style="font-size:${labelFS+4}px;">${d.getHours()}</span></div>`;
            }
            if (isLast) html += `<text x="${x}" y="${plotHeight + 15}" class="label-time" font-size="${labelFS}" text-anchor="middle">${d.getHours()}</text>`;
        }
    }

    // 現在時刻線
    const startTime = new Date(allData.data.time[startIdx]).getTime();
    const nowX = (drawReferenceTime.getTime() - startTime) / 3600000 * hScale;
    if (nowX >= 0 && nowX <= totalW) html += `<line x1="${nowX}" y1="0" x2="${nowX}" y2="${plotHeight}" stroke="#0000FF" stroke-width="2.5" stroke-dasharray="4 3" />`;

    datasets.forEach(ds => {
        if (ds.type === 'bar') {
            const currentFilters = activeWindFilters || targetWindDirections;
            const thHigh = viewConfig.windThresholdHigh;
            const thMid  = viewConfig.windThresholdMid;
            const thLow  = viewConfig.windThresholdLow;

            // --- 修正箇所：言語に依存しないフィルタ比較用インデックスリストの作成 ---
            const filterIndices = currentFilters.map(val => {
                let idx = jaDirs.indexOf(val);
                if (idx === -1) idx = enDirs.indexOf(val);
                return idx;
            }).filter(idx => idx !== -1);

            for(let i = startIdx; i < totalDataCount; i++){
                const val = ds.data[i];
                if (val === null || typeof val === 'undefined') continue;
                
                const h = ((val - min) / range) * plotHeight;
                const x = (i - startIdx) * hScale;
                const deg = allData.data.wind_direction_10m[i];
                const dirText = getWindDirText(deg);

                // --- 修正箇所：インデックスによる一致判定 ---
                let currentDirIdx = jaDirs.indexOf(dirText);
                if (currentDirIdx === -1) currentDirIdx = enDirs.indexOf(dirText);
                
                const isTargetDir = filterIndices.includes(currentDirIdx);
                
                let color = '#ccc'; 

                if (isTargetDir) {
                    if (val >= thHigh) color = '#dc143c';
                    else if (val >= thMid) color = '#ffa500';
                    else if (val >= thLow) color = '#87CEEB';
                } else {
                    if (val >= thHigh) color = 'rgba(220, 20, 60, 0.4)';
                }

                html += `<rect x="${x - (hScale*0.4)}" y="${plotHeight-h}" width="${hScale*0.8}" height="${h}" fill="${color}" />`;
                if (isWind) {
                    html += `<path d="M0,-12 L6,6 L0,2 L-6,6 Z" transform="translate(${x}, ${plotHeight-h-25}) rotate(${(deg+180)%360}) scale(${1.6 * iScale})" class="wind-arrow" />`;
                }
            }
        } else {
            let points = [];
            for(let i = startIdx; i < totalDataCount; i++){
                const v = ds.data[i];
                if (v === null) {
                    if (points.length > 1) html += `<polyline class="${ds.cls}" points="${points.join(' ')}" />`;
                    points = []; continue;
                }
                points.push(`${(i - startIdx) * hScale},${plotHeight - (((v - min) / range) * plotHeight)}`);
            }
            if (points.length > 1) html += `<polyline class="${ds.cls}" points="${points.join(' ')}" />`;
        }
    });

    svg.innerHTML = html;
    dateCont.innerHTML = dateContHtml;
    if (isFirst && dateTop) dateTop.innerHTML = dateTopHtml;
    if (isFirst && timeTop) timeTop.innerHTML = timeTopHtml;
}

/**
 * サブルーチン：ツールチップイベントの初期化（デバッグ表示版）
 */
function initTooltipEvent(startIdx, hScale, totalW, labelFS, drawReferenceTime) {
    const stage = document.getElementById('stage');
    const guide = document.getElementById('hover-guide');
    const tooltip = document.getElementById('tooltip');

    if (!stage || !guide || !tooltip) return;

    // デバッグ用：受け取った瞬間の値を保持
    const debugRawValue = drawReferenceTime;
    const isDateObject = (drawReferenceTime instanceof Date);

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

        const tUnit = viewConfig.temperatureUnit === 'celsius' ? '℃' : '℉';
        const wUnit = i18n.t('speedunit'); 

        const precipVal = getVal(allData.data.precipitation ? allData.data.precipitation[validIdx] : null, "mm");
        const windVal = getVal(allData.data.wind_speed_10m ? allData.data.wind_speed_10m[validIdx] : null, wUnit);
        const tempVal = getVal(allData.data.temperature_2m ? allData.data.temperature_2m[validIdx] : null, tUnit);
        const seaTempVal = getVal(allData.data.sea_surface_temperature ? allData.data.sea_surface_temperature[validIdx] : null, tUnit);
        const waveVal = getVal(allData.data.wave_height ? allData.data.wave_height[validIdx] : null, "m", 2);
        const tideVal = getVal(allData.data.sea_level_height_msl ? allData.data.sea_level_height_msl[validIdx] : null, "m", 2);

        const rotateDeg = (deg !== null && !isNaN(deg)) ? (deg + 180) % 360 : 0;

        // 表示用時刻の計算（フォールバック付き）
        const n = isDateObject ? debugRawValue : new Date();
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
            // 【スクロール時：グラフの下端に張り付く】
            const rect = stage.getBoundingClientRect();
            tooltip.style.left = (100 + hs * 3) + "px";
            tooltip.style.top = (rect.bottom - tooltip.offsetHeight) + "px";
            tooltip.style.bottom = "auto";
        } else {
            // 【マウス移動・クリック時：従前のとおり高さに合わせる】
            const tooltipWidth = tooltip.offsetWidth || 220;
            let tx = (clientX > window.innerWidth / 2) ? clientX - tooltipWidth - 20 : clientX + 20;
            tooltip.style.left = tx + "px";
            
            let ty = clientY + 20;
            if (ty + tooltip.offsetHeight + 70 > window.innerHeight) {
                tooltip.style.bottom = "70px"; 
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
            
            const updateStickyGroup = (selector) => {
                const labels = document.querySelectorAll(selector);
                labels.forEach((el, index) => {
                    const x = parseFloat(el.dataset.x);
                    const nextEl = labels[index + 1];
                    const nextX = nextEl ? parseFloat(nextEl.dataset.x) : Infinity;

                    if (sl >= nextX) {
                        el.style.display = "none";
                        el.style.visibility = "hidden";
                    } 
                    else if (index === 0 || sl >= x) {
                        el.style.display = "block";
                        el.style.visibility = "visible";
                        el.style.left = (sl - 100) + "px"; 
                    } 
                    else {
                        el.style.display = "block";
                        el.style.visibility = "visible";
                        el.style.left = x + "px";
                    }
                });
            };

            // 上部と下部を分離して計算（NodeListの混線を防止）
            updateStickyGroup('.sticky-date-top');
            updateStickyGroup('.sticky-date-bottom');

            if (typeof window.updateTooltipFromScroll === 'function' && !isNaN(hs) && !isNaN(sIdx)) {
                const visualOffset = hs * 2; 
                const targetX = sl + visualOffset; 
                const hourIdx = (targetX / hs) + sIdx;
                // isAutoScroll を true として呼び出し
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

    // 1. 現在の表示単位（ラベル用）を取得
    const unit = i18n.t('speedunit'); 

    // 2. 設定値をそのまま取得
    const thHigh = Math.round(viewConfig.windThresholdHigh);
    const thMid  = Math.round(viewConfig.windThresholdMid);
    const thLow  = Math.round(viewConfig.windThresholdLow);

    // 3. HTMLを生成して反映
    container.innerHTML = `
        <div class="legend-wind-item">
            <span class="legend-wind-label" data-i18n="legendWindTitle">${i18n.t('legendWindTitle')}</span>
            <span class="legend-wind-rect" style="background: #dc143c;"></span>
            <span class="legend-wind-label">${thHigh}${unit}〜</span>
        </div>
        <div class="legend-wind-item">
            <span class="legend-wind-rect" style="background: #ffa500;"></span>
            <span class="legend-wind-label">${thMid}${unit}〜</span>
        </div>
        <div class="legend-wind-item">
            <span class="legend-wind-rect" style="background: #87ceeb;"></span>
            <span class="legend-wind-label">${thLow}${unit}〜</span>
        </div>
        <div class="legend-wind-item">
            <span class="legend-wind-rect" style="background: #ccc;"></span>
            <span class="legend-wind-label">…</span>
        </div>
    `;
}

/**
 * 依存サブルーチン：風速の単位変換ヘルパー
 */
function convertWindSpeedValue(value, unit, reverse = false) {
    const factors = {
        'kn': 1.94384,
        'kmh': 3.6,
        'mph': 2.23694,
        'ms': 1.0
    };
    const factor = factors[unit] || 1.0;
    return reverse ? (value / factor) : (value * factor);
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
 * サブルーチン：AdMobバナー広告の初期化（既存フッター対応版）
 * 2026-04-23：ストア未公開のため、AdSense移行を検討し一旦全停止。
 */
/* function initAdMob() {
    // 1. Google 広告ライブラリの動的読み込み
    const script = document.createElement('script');
    script.async = true;
    script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-app-pub-9150851667382123";
    script.crossOrigin = "anonymous";
    document.head.appendChild(script);

    // 2. 広告を表示するコンテナを作成
    const adContainer = document.createElement('div');
    adContainer.id = "ad-banner-bottom";
    adContainer.style.cssText = `
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        text-align: center;
        z-index: 9999;
        background: #ffffff;
        height: 60px;
        display: flex;
        justify-content: center;
        align-items: center;
        border-top: 1px solid #eaeaea;
    `;

    // 3. 広告ユニットの挿入
    adContainer.innerHTML = `
        <ins class="adsbygoogle"
             style="display:inline-block;width:320px;height:50px"
             data-ad-client="ca-app-pub-9150851667382123"
             data-ad-slot="5919866110"></ins>
    `;

    document.body.appendChild(adContainer);

    // 4. 実行
    script.onload = () => {
        try {
            (adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
            console.log("AdMob: 審査待ちまたはローカル環境のため広告は非表示です");
        }
    };
}
*/

// アプリ起動時の実行もコメントアウト
// window.addEventListener('DOMContentLoaded', initAdMob);

initApp();
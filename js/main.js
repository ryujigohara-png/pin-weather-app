let allData = {};
// --- [追加] 詳細設定の初期値と保存・読込ロジック ---
const defaultViewConfig = {
    hourWidth: 20,      // 旧 hScale
    windHeight: 180,    // 風速グラフ高さ
    subHeight: 100,     // 気温・海象グラフ高さ
    graphMargin: 0,    // グラフ間余白
    fontSize: 12,       // ラベルフォントサイズ
    iconScale: 0.7      // 風向アイコン倍率
};

// localStorageから読み込み、なければデフォルトを適用
let viewConfig = JSON.parse(localStorage.getItem('pin_weather_view_config')) || defaultViewConfig;

// --- [修正] 既存の定数を viewConfig 参照に付け替え ---
// これにより、既存コード内の「hScale」という変数を一括で動的に制御できます。
const hScale = viewConfig.hourWidth; 
const CACHE_DURATION = 4 * 60 * 60 * 1000; 

const windDirs = ["北", "北北東", "北東", "東北東", "東", "東南東", "南東", "南南東", "南", "南南西", "南西", "西南西", "西", "西北西", "北西", "北北西"];
const defaultSpots = [
    {lat: 31.337, lon: 130.795, label: "高須沖(鹿児島県)"},
    {lat: 35.30, lon: 139.48, label: "江の島沖(神奈川県)"}
];

let mySpots = JSON.parse(localStorage.getItem('pin_weather_spots')) || defaultSpots;
let targetWindDirections = JSON.parse(localStorage.getItem('pin_weather_wind_filter')) || [...windDirs];

let currentLat = mySpots[0].lat;
let currentLon = mySpots[0].lon;
let currentLabel = mySpots[0].label;

let map, tempMarker;



/**
 * サブルーチン：詳細設定モーダルの初期化
 * HTML側に onclick を書かず、JS側で全てのイベントを紐付ける。
 */
function initViewSettings() {
    const modal = document.getElementById('viewSettingsModal');
    const openBtn = document.getElementById('openSettingsBtn'); // サイドバーのボタン
    const closeBtn = document.getElementById('closeViewSettings'); // モーダル内の閉じるボタン
    const saveBtn = document.getElementById('saveViewSettings'); // モーダル内の保存ボタン
    const resetBtn = document.getElementById('resetViewSettings'); // 【追加】リセットボタン

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

    // 【追加】 4. リセットボタンのイベント紐付け
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            resetViewSettings();
        });
    }

    // 5. スライダーを動かした時の数値リアルタイム表示
    const configIds = ['hourWidth', 'windHeight', 'subHeight', 'margin', 'fontSize', 'iconScale'];
    configIds.forEach(id => {
        const input = document.getElementById(`input-${id}`);
        if (input) {
            input.oninput = () => {
                const valSpan = document.getElementById(`val-${id}`);
                if (valSpan) {
                    valSpan.textContent = (id === 'iconScale') ? input.value : input.value + "px";
                }
            };
        }
    });
}

/**
 * 内部サブルーチン：現在の viewConfig の値をスライダーとラベルに反映させる
 */
function syncSliderValues() {
    const configIds = ['hourWidth', 'windHeight', 'subHeight', 'margin', 'fontSize', 'iconScale'];
    configIds.forEach(id => {
        const val = viewConfig[id === 'margin' ? 'graphMargin' : id]; // 念のため名称不一致を吸収
        const input = document.getElementById(`input-${id}`);
        const valSpan = document.getElementById(`val-${id}`);
        
        if (input) input.value = val;
        if (valSpan) {
            valSpan.textContent = (id === 'iconScale') ? val : val + "px";
        }
    });
}


/**
 * サブルーチン：設定の保存と適用
 * localStorageに書き込み、ページをリロードして定数を再定義させる。
 */
function saveViewSettings() {
    // UIから値を取得して viewConfig を更新
    viewConfig.hourWidth = parseInt(document.getElementById('input-hourWidth').value);
    viewConfig.windHeight = parseInt(document.getElementById('input-windHeight').value);
    viewConfig.subHeight = parseInt(document.getElementById('input-subHeight').value);
    viewConfig.graphMargin = parseInt(document.getElementById('input-margin').value);
    viewConfig.fontSize = parseInt(document.getElementById('input-fontSize').value);
    viewConfig.iconScale = parseFloat(document.getElementById('input-iconScale').value);

    // localStorageに保存（JSON形式）
    localStorage.setItem('pin_weather_view_config', JSON.stringify(viewConfig));

    // 完了通知を出してリロード
    // alert('設定を保存しました。再読み込みして反映します。'); 
    location.reload();
}

/**
 * サブルーチン：設定のリセット処理
 * 定義済みの defaultViewConfig を使用して設定を初期化する
 */
function resetViewSettings() {
    if (confirm("表示設定をデフォルトに戻しますか？")) {
        // オブジェクトの参照を切り離してコピー（安全のため）
        const resetData = JSON.parse(JSON.stringify(defaultViewConfig));
        
        // localStorageを初期値で上書き保存
        localStorage.setItem('pin_weather_view_config', JSON.stringify(resetData));
        
        // 反映のためリロード
        location.reload();
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
            headerColor: "#007bff", 
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

function initApp() {
    // 既存の初期化処理の中で呼び出す
    initViewSettings();
    applyEnvVisuals(); 
    renderTabs();
    initCompassUI();
    updateLocation(currentLat, currentLon, currentLabel);
    
    generateSidebarQRCode();

    const searchInput = document.getElementById('map-search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') executeMapSearch();
        });
    }
    
    const searchBtn = document.getElementById('map-search-btn');
    if (searchBtn) searchBtn.onclick = executeMapSearch;
    
    const windCfgBtn = document.getElementById('wind-cfg-btn');
    if (windCfgBtn) {
        windCfgBtn.onclick = () => {
            toggleSidebar();
            openModal('wind-modal');
        };
    }
    
    const applyWindBtn = document.getElementById('apply-wind-btn');
    if (applyWindBtn) {
        applyWindBtn.onclick = () => {
            localStorage.setItem('pin_weather_wind_filter', JSON.stringify(targetWindDirections));
            closeModal('wind-modal');
            draw();
        };
    }

    const gpsBtn = document.getElementById('gps-btn');
    if (gpsBtn) gpsBtn.onclick = () => handleGPSClick();
    
    const mapBtn = document.getElementById('map-btn');
    if (mapBtn) {
        mapBtn.onclick = () => { 
            openMap(); 
            renderTabs("Map"); 
        };
    }
}

function toggleSidebar() {
    const sb = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (!sb || !overlay) return;
    const isOpen = sb.classList.contains('open');
    if (isOpen) {
        sb.classList.remove('open');
        overlay.style.display = 'none';
    } else {
        sb.classList.add('open');
        overlay.style.display = 'block';
    }
}

function initCompassUI() {
    const container = document.getElementById('compass-ui');
    if (!container) return;
    const radius = 130; 
    const centerX = 160; 
    const centerY = 160;

    container.innerHTML = '<div class="compass-center">ALL</div>';

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
 * サブルーチン：タブのレンダリング処理
 * 未登録地点を左端に表示し、isSelected時にスムーズスクロールで左端へ持ってくる。
 */
function renderTabs(activeOverrideLabel = null) {
    const container = document.getElementById('spot-tabs');
    if (!container) return;
    container.innerHTML = "";

    const activeLabel = activeOverrideLabel || currentLabel;
    const activeIdx = mySpots.findIndex(s => s.label === activeLabel);
    let displaySpots = [...mySpots];
    let activeSpot = null;
    let isExternalSpot = false;

    if (activeIdx > -1) {
        activeSpot = displaySpots.splice(activeIdx, 1)[0];
    } else if (activeLabel && activeLabel !== 'gps' && activeLabel !== 'map' && activeLabel !== 'GPS' && activeLabel !== 'Map') {
        isExternalSpot = true;
        activeSpot = {
            label: activeLabel,
            lat: currentLat,
            lon: currentLon
        };
    }

    let items = [];
    if (activeSpot) {
        items.push({ 
            id: activeSpot.label, 
            label: isExternalSpot ? activeSpot.label : `📍 ${activeSpot.label}`, 
            lat: activeSpot.lat, 
            lon: activeSpot.lon, 
            rawLabel: activeSpot.label,
            isExternal: isExternalSpot 
        });
    }

    items.push({ id: 'gps', label: 'GPS', isSpecial: true });
    items.push({ id: 'map', label: 'Map', isSpecial: true });
    
    displaySpots.forEach(s => {
        items.push({ id: s.label, label: `📍 ${s.label}`, lat: s.lat, lon: s.lon, rawLabel: s.label });
    });

    items.forEach((item) => {
        const btn = document.createElement('button');
        const isSelected = (item.id === activeLabel || item.label === activeLabel || item.rawLabel === activeLabel);
        
        btn.className = 'btn';
        if (item.id === 'gps') {
            btn.classList.add('btn-gps');
        } else if (item.id === 'map') {
            btn.classList.add('btn-map-view');
        } else {
            btn.classList.add('btn-location');
            btn.setAttribute('data-raw-label', item.rawLabel);
        }

        if (isSelected) {
            btn.classList.add('active');
            // 'start' にすることで左端にスクロールさせる
            setTimeout(() => btn.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' }), 100);
        }
        btn.innerText = item.label;

        btn.onclick = () => {
            if (item.id === 'gps') {
                handleGPSClick();
            } else if (item.id === 'map') {
                openMap();
                renderTabs("Map");
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
            }
        };

        if (!item.isSpecial && !item.isExternal) {
            const spotIdx = mySpots.findIndex(s => s.label === item.rawLabel);
            btn.oncontextmenu = (e) => { e.preventDefault(); confirmDelete(spotIdx); };
            let timer;
            btn.ontouchstart = () => { timer = setTimeout(() => confirmDelete(spotIdx), 800); };
            btn.ontouchend = () => clearTimeout(timer);
        }
        container.appendChild(btn);
    });
}


function confirmDelete(index) {
    if (index === -1) return;
    if (confirm(`「${mySpots[index].label}」を削除しますか？`)) {
        mySpots.splice(index, 1);
        localStorage.setItem('pin_weather_spots', JSON.stringify(mySpots));
        renderTabs();
    }
}

const resetBtn = document.getElementById('reset-all-btn');
if (resetBtn) {
    resetBtn.onclick = () => {
        if (confirm("初期化しますか？")) {
            toggleSidebar();
            mySpots = JSON.parse(JSON.stringify(defaultSpots));
            localStorage.setItem('pin_weather_spots', JSON.stringify(mySpots));
            targetWindDirections = [...windDirs];
            localStorage.setItem('pin_weather_wind_filter', JSON.stringify(targetWindDirections));
            updateLocation(mySpots[0].lat, mySpots[0].lon, mySpots[0].label);
        }
    };
}


/**
 * サブルーチン：GPSボタンクリック時の処理
 * 現在地を取得し、逆引きAPIで地名を取得してからupdateLocationを呼び出す。
 */
function handleGPSClick() {
    if ("geolocation" in navigator) {
        // 状態表示（任意ですが、UX向上のため）
        const gpsBtn = document.querySelector('.btn-gps');
        if (gpsBtn) gpsBtn.innerText = "取得中...";

        navigator.geolocation.getCurrentPosition(async (pos) => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            let gpsLabel = "GPS地点";

            try {
                // GPS座標から地名を逆引き
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=ja`);
                const data = await res.json();
                const addr = data.address;
                const city = addr.city || addr.town || addr.village || "";
                const district = addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || "";
                if (city || district) {
                    gpsLabel = (city + district) + "(GPS)";
                }
            } catch (err) {
                console.error("GPS逆引き失敗:", err);
            }

            if (gpsBtn) gpsBtn.innerText = "GPS";
            // 取得した地名で場所を更新（renderTabsが走り、左端に配置される）
            updateLocation(lat, lon, gpsLabel);
        }, (err) => {
            console.error("GPS取得エラー:", err);
            if (gpsBtn) gpsBtn.innerText = "GPS";
            alert("位置情報の取得に失敗しました。");
        });
    }
}

const addBtn = document.getElementById('add-btn');
if (addBtn) addBtn.onclick = () => openMap();

function openMap() {
    openModal('map-modal');
    if (!map) {
        const esri = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', { attribution: 'Esri' });
        const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: 'Esri' });
        const gsi = L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png', { attribution: '&copy; 国地理院' });
        map = L.map('map-canvas', { center: [currentLat, currentLon], zoom: 14, layers: [esri] });
        L.control.layers({ "標準地図": esri, "衛星写真": satellite, "地理院地図": gsi }).addTo(map);
        map.on('click', onMapClick);
        fetchAddressInfo(currentLat, currentLon);
    } else {
        map.setView([currentLat, currentLon], 14);
        fetchAddressInfo(currentLat, currentLon);
    }
    if (tempMarker) map.removeLayer(tempMarker);
    tempMarker = L.marker([currentLat, currentLon]).addTo(map);
}

function openModal(id) { 
    const el = document.getElementById(id);
    if (el) el.style.display = 'flex'; 
}
function closeModal(id) { 
    const el = document.getElementById(id);
    if (el) el.style.display = 'none'; 
}

// 設定保存時に実行
function applyStylesToCSS() {
    const root = document.documentElement;
    // グラフを包むコンテナ（例：.svg-container）の余白を一括制御
    root.style.setProperty('--graph-margin', `${viewConfig.graphMargin}px`);
    // ラベル等の共通フォントサイズ
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
 * 地図クリック時や検索時に呼び出され、未登録地点表示ボタンと保存ボタンの挙動を定義する。
 */
async function fetchAddressInfo(lat, lng) {
    const statusEl = document.getElementById('map-status');
    if (statusEl) statusEl.innerText = "地点情報を取得中...";
    
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ja`);
        const data = await res.json();
        const addr = data.address;
        const city = addr.city || addr.town || addr.village || "";
        const district = addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || "";
        const defaultName = city + district || "新規地点";

        // 「登録せずに表示」ボタンの設定
        const tempViewBtn = document.getElementById('temp-view-btn');
        if (tempViewBtn) {
            tempViewBtn.onclick = () => {
                // 地名に(未登録)を付与して更新。renderTabsのisExternalロジックにより左端に配置される。
                updateLocation(lat, lng, defaultName + "(未登録)");
                closeModal('map-modal');
            };
            tempViewBtn.disabled = false;
        }

        // 「この地点を保存」ボタンの設定
        const saveSpotBtn = document.getElementById('save-spot-btn');
        if (saveSpotBtn) {
            saveSpotBtn.onclick = () => {
                const spotName = prompt("登録する地点名を確認・修正してください", defaultName);
                if (spotName) {
                    mySpots.push({lat, lon: lng, label: spotName});
                    localStorage.setItem('pin_weather_spots', JSON.stringify(mySpots));
                    renderTabs();
                    updateLocation(lat, lng, spotName);
                    closeModal('map-modal');
                }
            };
            saveSpotBtn.disabled = false;
        }
        
        if (statusEl) statusEl.innerText = "📍：" + defaultName;
    } catch (err) {
        if (statusEl) statusEl.innerText = "地点名取得失敗";
    }
}

async function updateLocation(lat, lon, label) {
    currentLat = lat; currentLon = lon; currentLabel = label;
    renderTabs(); 
    await draw(); 
}

const weatherIcons = { 0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️", 45: "🌫️", 48: "🌫️", 51: "🌦️", 53: "🌦️", 55: "🌦️", 61: "🌧️", 63: "🌧️", 65: "🌧️", 71: "❄️", 73: "❄️", 75: "❄️", 80: "🌦️", 81: "🌦️", 82: "🌦️", 95: "⛈️" };
function getWindDirText(deg) { return windDirs[Math.round(deg / 22.5) % 16]; }

/**
 * サブルーチン：キャッシュ付きデータ取得
 * リロード（再読み込み）時はキャッシュを無視して強制的にAPIを叩く。
 */
async function fetchWithCache(lat, lon) {
    const cacheKey = `weather_cache_${lat.toFixed(3)}_${lon.toFixed(3)}`;
    const cached = localStorage.getItem(cacheKey);
    const now = Date.now();

    // ページがリロード（再読み込み）されたかどうかを判定
    const navEntries = performance.getEntriesByType('navigation');
    const isReload = navEntries.length > 0 && navEntries[0].type === 'reload';

    // リロードでなく、かつキャッシュが存在し、有効期限内であればキャッシュを返す
    if (!isReload && cached) {
        const parsed = JSON.parse(cached);
        if (now - parsed.timestamp < CACHE_DURATION) {
            return { timestamp: parsed.timestamp, data: parsed.data };
        }
    }

    // API取得（リロード時、またはキャッシュ切れの場合）
    const wUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,wind_speed_10m,wind_direction_10m,weather_code,precipitation&timezone=auto&forecast_days=9&wind_speed_unit=ms`;
    const mUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&hourly=wave_height,sea_surface_temperature,sea_level_height_msl&timezone=auto&forecast_days=9&cell_selection=sea`;

    try {
        const [wRes, mRes] = await Promise.all([
            fetch(wUrl).then(r => r.json()),
            fetch(mUrl).then(r => r.json())
        ]);

        const mergedData = { ...wRes.hourly, ...mRes.hourly };
        const cacheData = { timestamp: now, data: mergedData };
        
        // 最新データをキャッシュに保存
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        return cacheData;

    } catch (error) {
        console.error("API取得失敗:", error);
        // APIが失敗した際、古いキャッシュがあればそれを返す（全滅を防ぐための保険）
        if (cached) {
            const parsed = JSON.parse(cached);
            return { timestamp: parsed.timestamp, data: parsed.data };
        }
        throw error;
    }
}


/**
 * 外部気象サービスを現在の座標で開く
 * @param {string} service - 'yahoo', 'windy', 'windfinder'
 */
function openExternalWeather(service) {
    if (!currentLat || !currentLon) {
        alert("地点情報がありません。");
        return;
    }

    let url = "";
    switch (service) {
        case 'yahoo':
            // Yahoo!天気（ピンポイント天気検索へ）
            const now = new Date();
            const Y = now.getFullYear();
            const M = String(now.getMonth() + 1).padStart(2, '0');
            const D = String(now.getDate()).padStart(2, '0');
            const h = String(now.getHours()).padStart(2, '0');
            const m = String(Math.floor(now.getMinutes() / 5) * 5).padStart(2, '0');
            const tParam = `${Y}${M}${D}${h}${m}00`;

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
 * サブルーチン：メイン描画処理
 * 画面右半分でのツールチップ反転を厳格化し、サイドバーの幅設定(hScale)を
 * 日付ラベルや座標計算の全工程に完全反映した修正版。
 */
async function draw() {
    try {
        allData = await fetchWithCache(currentLat, currentLon);
        const svgW = document.getElementById('svg-weather');
        if (!svgW) return;

        // 風向アイコンを西(左)に向け、文字と1行に収まるように調整
        const baseWindIcon = `<svg width="14" height="14" viewBox="-8 -15 16 20" style="vertical-align:middle; margin-right:2px; display:inline-block;"><path d="M0,-12 L6,6 L0,2 L-6,6 Z" fill="#00d4ff" stroke="#008eb3" stroke-width="1" transform="rotate(-90)"/></svg>`;

        // --- Y軸ラベルのアイコン設置 ---
        const titles = document.querySelectorAll('.y-axis-title');
        if (titles.length >= 4) {
            titles[0].innerHTML = `天気<br>降水量mm`;
            titles[1].innerHTML = `${baseWindIcon}風向<br>風速(m/s)`;
            titles[2].innerHTML = `気温(℃)<br>海水(℃)`;
            titles[3].innerHTML = `波高(m)<br>潮位(m)`;
        }

        // --- 表示開始位置の計算（現在時刻の4時間前から） ---
        const now = new Date();
        const fullIdx = allData.data.time.findIndex(t => new Date(t) > now) - 1;
        const startIdx = Math.max(0, fullIdx - 4);
        const displayCount = 216 - startIdx;

        // --- 設定値の取得（サイドバーの値：hScaleが全ての基準） ---
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
        const valContW = document.getElementById('val-svg-weather');
        const pData = allData.data.precipitation ? allData.data.precipitation.slice(startIdx) : [];
        const pMax = Math.ceil(Math.max(...pData, 1.0) / 5) * 5; // 5mm刻みでスケール
        const pMin = 0;
        const pRange = pMax - pMin;
        const pPlotH = 35; // 棒グラフの表示領域の高さ
        const pBaseY = 75; // 棒グラフの底辺Y座標

        // 降水量の最大値と最小値をラベルに反映
        if (valContW) {
            //valContW.innerHTML = `<div   class="y-max">${pMax.toFixed(0)}</div><div class="y-min">${pMin.toFixed(0)}</div>`;
        }
        // 降水量セクションのグリッド線
        for (let v = 0; v <= pMax; v += 5) {
            const gy = pBaseY - (v / pRange) * pPlotH;
            wHtml += `<line x1="0" y1="${gy}" x2="${totalW}" y2="${gy}" class="grid-y-sub" />`;
        }

        for(let i = startIdx; i < 216; i++) {
            const x = (i - startIdx) * hScale; 
            const icon = weatherIcons[allData.data.weather_code[i]] || "❓";
            // 天気アイコン
            wHtml += `<text x="${x}" y="32" font-size="28" text-anchor="middle">${icon}</text>`; 
            
            // 降水量棒グラフ
            const p = allData.data.precipitation ? allData.data.precipitation[i] : 0;
            if (p > 0) {
                const barH = (p / pRange) * pPlotH;
                wHtml += `<rect x="${x - (hScale*0.3)}" y="${pBaseY - barH}" width="${hScale*0.6}" height="${barH}" fill="#0059ff" opacity="0.7" />`;
                // 1.0mm以上なら数値を表示（視認性のため）
                //if (p >= 1.0) {
                    wHtml += `<text x="${x}" y="${pBaseY - barH - 2}" font-size="${labelFS - 2}" font-weight="bold" fill="#0000FF" text-anchor="middle">${p.toFixed(1)}</text>`;
                //}
            }
        }
        svgW.innerHTML = wHtml;

        // --- 各セクション描画関数 ---
        function renderSection(svgId, dateContId, datasets, height, stepY, isWind = false, isLast = false, isFirst = false) {
            const svg = document.getElementById(svgId);
            const dateCont = document.getElementById(dateContId);
            const dateTop = document.getElementById('date-top');
            const valCont = document.getElementById(`val-${svgId}`);

            if (!svg || !dateCont) return;
            dateCont.innerHTML = "";
            if (isFirst && dateTop) dateTop.innerHTML = "";
            
            const allVals = datasets.flatMap(ds => ds.data ? ds.data.slice(startIdx) : []);
            if (allVals.length === 0) return;
            
            let max = Math.ceil(Math.max(...allVals) / stepY) * stepY;
            let min = Math.floor(Math.min(...allVals) / stepY) * stepY;
            if (isWind) min = 0;
            // ▽ 追加：最大値と最小値をラベルに反映（絶対位置などはCSSで制御することを想定）
            if (valCont) {
                valCont.innerHTML = `<div class="y-max">${max.toFixed(isWind ? 0 : 1)}</div><div class="y-min">${min.toFixed(isWind ? 0 : 1)}</div>`;
            }
            const range = (max - min) || 1;
            const plotHeight = height - 20; 
            let html = "";

            for (let v = min; v <= max; v += stepY) {
                const yPosSvg = plotHeight - (((v - min) / range) * plotHeight);
                html += `<line x1="0" y1="${yPosSvg}" x2="${totalW}" y2="${yPosSvg}" class="grid-y-sub" />`;
            }

            const weekDays = ["日", "月", "火", "水", "木", "金", "土"];
            for (let i = startIdx; i < 216; i++) {
                const x = (i - startIdx) * hScale;
                const d = new Date(allData.data.time[i]);
                
                if (i % 24 === 0 || i === startIdx) {
                    html += `<line x1="${x}" y1="0" x2="${x}" y2="${plotHeight}" class="grid-day" />`;
                    
                    const dayIdx = d.getDay();
                    const dayStr = weekDays[dayIdx];
                    let dayColor = (dayIdx === 0) ? "#FF0000" : (dayIdx === 6 ? "#0000FF" : "#000000");
                    // 修正点：labelContentの生成をdayStr, dayColorの定義の後に移動
                    const labelContent = `<span style="color:${dayColor}; font-size:${labelFS * 1.5}px;">${d.getMonth()+1}/${d.getDate()}(${dayStr})</span>`;

                    const dateDiv = document.createElement('div');
                    dateDiv.className = 'sticky-date';
                    dateDiv.style.left = `${x}px`;
                    dateDiv.dataset.x = x;

                    // 【追加】上部コンテナ用ラベル生成 (isFirstがtrueの時のみ)
                    if (isFirst && dateTop) {
                        const topDiv = document.createElement('div');
                        topDiv.className = 'sticky-date';
                        topDiv.style.left = `${x}px`;
                        topDiv.dataset.x = x;
                        topDiv.innerHTML = labelContent;
                        dateTop.appendChild(topDiv);
                    }

                    if (isLast) {
                        dateDiv.innerHTML = labelContent;
                    }
                    dateCont.appendChild(dateDiv);
                } else if (i % 3 === 0) {
                    html += `<line x1="${x}" y1="0" x2="${x}" y2="${plotHeight}" class="grid-3h" />`;
                    if (isLast) {
                        html += `<text x="${x}" y="${plotHeight + 15}" class="label-time" font-size="${labelFS}" text-anchor="middle">${d.getHours()}</text>`;
                    }
                }
            }

            // --- 縦線描画（現在時刻・データ取得時刻） ---
            const startTime = new Date(allData.data.time[startIdx]).getTime();
            const nowTime = new Date().getTime();
            const diffHoursNow = (nowTime - startTime) / (1000 * 60 * 60); 
            if (diffHoursNow >= 0 && diffHoursNow < (216 - startIdx)) {
                const nowX = diffHoursNow * hScale;
                html += `<line x1="${nowX}" y1="0" x2="${nowX}" y2="${plotHeight}" stroke="#0000FF" stroke-width="2.5" stroke-dasharray="4 3" />`;
            }
            if (allData.timestamp) {
                const fetchedTime = new Date(allData.timestamp).getTime();
                const diffHoursFetch = (fetchedTime - startTime) / (1000 * 60 * 60); 
                if (diffHoursFetch >= 0 && diffHoursFetch < (216 - startIdx)) {
                    const fetchX = diffHoursFetch * hScale;
                    html += `<line x1="${fetchX}" y1="0" x2="${fetchX}" y2="${plotHeight}" stroke="#228b22" stroke-width="2.5" stroke-dasharray="3 2" />`;
                }
            }

            datasets.forEach(ds => {
                if (ds.type === 'bar') {
                    for(let i = startIdx; i < 216; i++){
                        const val = ds.data[i] || 0;
                        const h = ((val - min) / range) * plotHeight;
                        const x = (i - startIdx) * hScale;
                        const deg = allData.data.wind_direction_10m[i];
                        const dirText = getWindDirText(deg);
                        // 風速色分けロジックの修正
                        let color;
                        if (targetWindDirections.includes(dirText)) {
                            if (val >= 10.0) color = '#dc143c';      // 10以上
                            else if (val >= 5.0) color = '#ffa500';  // 5以上10未満
                            else if (val >= 3.0) color = '#87CEEB';  // 3以上5未満（水色）
                            else color = '#ccc';                  // それ以外（ごく薄い水色など）
                        } else {
                            color = (val >= 10.0 ? 'rgba(220, 20, 60, 0.4)' : '#ccc');
                        }

                        html += `<rect x="${x - (hScale*0.4)}" y="${plotHeight-h}" width="${hScale*0.8}" height="${h}" fill="${color}" />`;
                        if (isWind) {
                            html += `<path d="M0,-12 L6,6 L0,2 L-6,6 Z" transform="translate(${x}, ${plotHeight-h-25}) rotate(${(deg+180)%360}) scale(${1.6 * iScale})" class="wind-arrow" />`;
                        }
                    }
                } else {
                    let pts = "";
                    for(let i = startIdx; i < 216; i++){
                        const v = ds.data[i] || 0;
                        const x = (i - startIdx) * hScale;
                        const y = plotHeight - (((v - min) / range) * plotHeight);
                        pts += `${x},${y} `;
                    }
                    html += `<polyline class="${ds.cls}" points="${pts.trim()}" />`;
                }
            });
            svg.innerHTML = html;
        }

        renderSection("svg-wind", "date-wind", [{ data: allData.data.wind_speed_10m, type: 'bar' }], viewConfig.windHeight, 5.0, true, false, true);
        renderSection("svg-temps", "date-temp", [{ data: allData.data.temperature_2m, type: 'line', cls: 'line-temp-air' }, { data: allData.data.sea_surface_temperature, type: 'line', cls: 'line-temp-sea' }], viewConfig.subHeight, 5.0, false, false, false);
        renderSection("svg-marine", "date-marine", [{ data: allData.data.wave_height, type: 'line', cls: 'line-wave' }, { data: allData.data.sea_level_height_msl, type: 'line', cls: 'line-tide' }], viewConfig.subHeight, 0.5, false, true, false);

        resetGraphScroll();

        const scrollRoot = document.getElementById('scroll-root');
        const stage = document.getElementById('stage');
        const guide = document.getElementById('hover-guide');
        const tooltip = document.getElementById('tooltip');

        if (scrollRoot) {
            scrollRoot.onscroll = () => {
                const sl = scrollRoot.scrollLeft;
                document.querySelectorAll('.sticky-date').forEach(el => {
                    const x = parseFloat(el.dataset.x);
                    const nextX = x + (24 * hScale);
                    el.style.left = (sl >= x && sl < nextX - 100) ? (sl - 100) + "px" : x + "px";
                });
            };
            scrollRoot.dispatchEvent(new Event('scroll'));
        }

        if (stage && guide && tooltip) {
            stage.onmousemove = (e) => {
                const rect = stage.getBoundingClientRect();
                const graphX = (e.clientX - rect.left) - 100; 
                if (graphX < 0 || graphX > totalW) {
                    guide.style.display = "none"; tooltip.style.display = "none"; return;
                }

                let hourIdx = Math.round(graphX / hScale) + startIdx;
                hourIdx = Math.min(Math.max(hourIdx, startIdx), 215);

                const snapX = (hourIdx - startIdx) * hScale + 100;
                guide.style.left = snapX + "px"; 
                guide.style.display = "block";
                tooltip.style.display = "block";
                
                const tooltipWidth = 180;
                let tx = (e.clientX > window.innerWidth / 2) ? e.clientX - tooltipWidth - 10 : e.clientX + 10;
                tooltip.style.left = tx + "px";

                let ty = e.clientY + 20;
                const tooltipHeight = tooltip.offsetHeight || 250; 
                if (ty + tooltipHeight > window.innerHeight) {
                    ty = window.innerHeight - tooltipHeight - 10; 
                }
                tooltip.style.top = ty + "px";

                const d = new Date(allData.data.time[hourIdx]); 
                const weekDays = ["日", "月", "火", "水", "木", "金", "土"];
                const dayStr = weekDays[d.getDay()];
                const deg = allData.data.wind_direction_10m[hourIdx];
                // 追加：天気アイコンの取得
                const wIcon = weatherIcons[allData.data.weather_code[hourIdx]] || "❓";
                const n = new Date();
                const nStr = `${n.getMonth()+1}/${n.getDate()}(${weekDays[n.getDay()]}) ${n.getHours()}:${n.getMinutes().toString().padStart(2, '0')}`;
                let ftStr = "--/--(曜) --:--";
                if (allData.timestamp) {
                    const ft = new Date(allData.timestamp);
                    ftStr = `${ft.getMonth()+1}/${ft.getDate()}(${weekDays[ft.getDay()]}) ${ft.getHours()}:${ft.getMinutes().toString().padStart(2, '0')}`;
                }

                tooltip.innerHTML = `
                    <span class="spot-name-tip">📍 ${currentLabel}</span>
                    <b>${d.getMonth()+1}/${d.getDate()}(${dayStr}) ${d.getHours()}:00 ${wIcon}</b>
                    <div class="icon-box"><span class="legend-bar" style="background:#0000FF; margin-right:0;"></span></div>降水: ${allData.data.precipitation ? allData.data.precipitation[hourIdx]?.toFixed(1) : "0.0"}mm<br>
                    <div class="icon-box"><svg width="14" height="14" viewBox="-8 -15 16 20" style="vertical-align:middle;"><path d="M0,-12 L6,6 L0,2 L-6,6 Z" fill="#00d4ff" stroke="#008eb3" stroke-width="1" transform="rotate(${(deg+180)%360})"/></svg></div>風向: ${getWindDirText(deg)} (${deg}°)<br>
                    <div class="icon-box">🚩</div>風速: ${allData.data.wind_speed_10m[hourIdx]?.toFixed(1) || "0.0"}m/s<br>
                    <div class="icon-box"><span class="legend-line" style="background:#ff4500; margin-right:0;"></span></div>気温: ${allData.data.temperature_2m[hourIdx]?.toFixed(1) || "0.0"}℃<br>
                    <div class="icon-box"><span class="legend-line" style="background:#00ced1; margin-right:0;"></span></div>海水: ${allData.data.sea_surface_temperature ? allData.data.sea_surface_temperature[hourIdx]?.toFixed(1) : "---"}℃<br>
                    <div class="icon-box"><span class="legend-line" style="background:#2ca02c; margin-right:0;"></span></div>波高: ${allData.data.wave_height ? allData.data.wave_height[hourIdx]?.toFixed(2) : "0.00"}m<br>
                    <div class="icon-box"><span class="legend-line" style="background:#1e90ff; margin-right:0;"></span></div>潮位: ${allData.data.sea_level_height_msl ? allData.data.sea_level_height_msl[hourIdx]?.toFixed(2) : "0.00"}m
                    <div style="margin-top:6px; border-top:1px solid #444; padding-top:4px; font-size:10px; color:#ccc; line-height:1.4;">
                        <span style="display:inline-block; width:15px; border-top:4px dotted #0000FF; vertical-align:middle; margin-right:4px;"></span>現在時刻 ${nStr}<br>
                        <span style="display:inline-block; width:15px; border-top:4px dotted #228b22; vertical-align:middle; margin-right:4px;"></span>データ取得 ${ftStr}
                    </div>
                `;
            };
            stage.onmouseleave = () => { guide.style.display = "none"; tooltip.style.display = "none"; };
        }
        
    } catch (e) { console.error(e); }
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



initApp();
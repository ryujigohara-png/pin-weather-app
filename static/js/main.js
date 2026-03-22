let allData = {};
// --- [追加] 詳細設定の初期値と保存・読込ロジック ---
const defaultViewConfig = {
    hourWidth: 32,      // 旧 hScale
    windHeight: 280,    // 風速グラフ高さ
    subHeight: 160,     // 気温・海象グラフ高さ
    graphMargin: 15,    // グラフ間余白
    fontSize: 12,       // ラベルフォントサイズ
    iconScale: 0.8      // 風向アイコン倍率
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

    if (!modal || !openBtn) return;

    // 1. サイドバーのボタンを押した時の動作（既存の openModal を活用）
    openBtn.addEventListener('click', () => {
        // 現在の設定値をスライダーに同期させてから表示
        syncSliderValues();
        openModal('viewSettingsModal');
    });

    // 2. 閉じるボタン（既存の closeModal を活用）
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

    // 4. スライダーを動かした時の数値リアルタイム表示
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
            headerColor: "#7681ba", 
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
            renderTabs("🗺️ Map"); 
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

function renderTabs(activeOverrideLabel = null) {
    const container = document.getElementById('spot-tabs');
    if (!container) return;
    container.innerHTML = "";

    const activeLabel = activeOverrideLabel || currentLabel;
    const activeIdx = mySpots.findIndex(s => s.label === activeLabel);
    let displaySpots = [...mySpots];
    let activeSpot = null;

    if (activeIdx > -1) {
        activeSpot = displaySpots.splice(activeIdx, 1)[0];
    }

    let items = [];
    if (activeSpot) {
        items.push({ id: activeSpot.label, label: `📍 ${activeSpot.label}`, lat: activeSpot.lat, lon: activeSpot.lon, rawLabel: activeSpot.label });
    }
    items.push({ id: 'gps', label: '🛰️ GPS', isSpecial: true });
    items.push({ id: 'map', label: '🗺️ Map', isSpecial: true });
    
    displaySpots.forEach(s => {
        items.push({ id: s.label, label: `📍 ${s.label}`, lat: s.lat, lon: s.lon, rawLabel: s.label });
    });

    items.forEach((item) => {
        const btn = document.createElement('button');
        const isSelected = (item.id === activeLabel || item.label === activeLabel || item.rawLabel === activeLabel);
        
        btn.className = 'btn';
        if (item.id === 'gps') btn.classList.add('btn-gps');
        else if (item.id === 'map') btn.classList.add('btn-map-view');
        else {
            btn.classList.add('btn-location');
            btn.setAttribute('data-raw-label', item.rawLabel);
        }

        if (isSelected) {
            btn.classList.add('active');
            setTimeout(() => btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }), 100);
        }
        btn.innerText = item.label;

        btn.onclick = () => {
            if (item.id === 'gps') {
                handleGPSClick();
            } else if (item.id === 'map') {
                openMap();
                renderTabs("🗺️ Map");
            } else {
                const idx = mySpots.findIndex(s => s.label === item.rawLabel);
                if (idx > -1) {
                    const selectedSpot = mySpots.splice(idx, 1)[0];
                    mySpots.unshift(selectedSpot);
                    localStorage.setItem('pin_weather_spots', JSON.stringify(mySpots));
                }
                updateLocation(item.lat, item.lon, item.rawLabel);
            }
        };

        if (!item.isSpecial) {
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
    } else {
        map.setView([currentLat, currentLon], 14);
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

async function fetchAddressInfo(lat, lng) {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ja`);
        const data = await res.json();
        const addr = data.address;
        const name = addr.city || addr.town || addr.village || "新規地点";
        
        const tempBtn = document.getElementById('temp-view-btn');
        if (tempBtn) {
            tempBtn.onclick = () => { updateLocation(lat, lng, name + "(未)"); closeModal('map-modal'); };
            tempBtn.disabled = false;
        }
        
        const saveBtn = document.getElementById('save-spot-btn');
        if (saveBtn) {
            saveBtn.onclick = () => {
                const spotName = prompt("地点名", name);
                if (spotName) {
                    mySpots.push({lat, lon: lng, label: spotName});
                    localStorage.setItem('pin_weather_spots', JSON.stringify(mySpots));
                    updateLocation(lat, lng, spotName);
                    closeModal('map-modal');
                }
            };
            saveBtn.disabled = false;
        }
    } catch (err) { console.error(err); }
}

async function updateLocation(lat, lon, label) {
    currentLat = lat; currentLon = lon; currentLabel = label;
    renderTabs(); 
    await draw(); 
}

function handleGPSClick() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition((pos) => {
            updateLocation(pos.coords.latitude, pos.coords.longitude, "🛰️ GPS");
        });
    }
}

const weatherIcons = { 0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️", 45: "🌫️", 48: "🌫️", 51: "🌦️", 53: "🌦️", 55: "🌦️", 61: "🌧️", 63: "🌧️", 65: "🌧️", 71: "❄️", 73: "❄️", 75: "❄️", 80: "🌦️", 81: "🌦️", 82: "🌦️", 95: "⛈️" };
function getWindDirText(deg) { return windDirs[Math.round(deg / 22.5) % 16]; }

async function fetchWithCache(lat, lon) {
    const cacheKey = `weather_cache_${lat.toFixed(3)}_${lon.toFixed(3)}`;
    const cached = localStorage.getItem(cacheKey);
    const now = Date.now();
    if (cached) {
        const parsed = JSON.parse(cached);
        if (now - parsed.timestamp < CACHE_DURATION) return parsed.data;
    }
    const wUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,wind_speed_10m,wind_direction_10m,weather_code,precipitation&timezone=auto&forecast_days=9`;
    const mUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&hourly=wave_height,sea_surface_temperature,sea_level_height_msl&timezone=auto&forecast_days=9&cell_selection=sea`;
    const [wRes, mRes] = await Promise.all([fetch(wUrl).then(r => r.json()), fetch(mUrl).then(r => r.json())]);
    const mergedData = { ...wRes.hourly, ...mRes.hourly };
    localStorage.setItem(cacheKey, JSON.stringify({ timestamp: now, data: mergedData }));
    return mergedData;
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

        // --- 表示開始位置の計算（現在時刻の4時間前から） ---
        const now = new Date();
        const fullIdx = allData.time.findIndex(t => new Date(t) > now) - 1;
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
        
        // --- 天気アイコン描画 ---
        let wHtml = "";
        for(let i = startIdx; i < 216; i++) {
            const x = (i - startIdx) * hScale; 
            const icon = weatherIcons[allData.weather_code[i]] || "❓";
            wHtml += `<text x="${x}" y="32" font-size="28" text-anchor="middle">${icon}</text>`; 
            const p = allData.precipitation ? allData.precipitation[i] : 0;
            if (p > 0) wHtml += `<text x="${x}" y="70" font-size="${labelFS + 2}" font-weight="bold" fill="#0000FF" text-anchor="middle">${p.toFixed(1)}</text>`;
        }
        svgW.innerHTML = wHtml;

        // --- 各セクション描画関数 ---
        function renderSection(svgId, dateContId, datasets, height, stepY, isWind = false, isLast = false) {
            const svg = document.getElementById(svgId);
            const dateCont = document.getElementById(dateContId);
            if (!svg || !dateCont) return;
            dateCont.innerHTML = "";
            const allVals = datasets.flatMap(ds => ds.data ? ds.data.slice(startIdx) : []);
            if (allVals.length === 0) return;
            
            let max = Math.ceil(Math.max(...allVals) / stepY) * stepY;
            let min = Math.floor(Math.min(...allVals) / stepY) * stepY;
            if (isWind) min = 0;
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
                const d = new Date(allData.time[i]);
                
                // 日付ラベル生成（hScaleに基づいた配置）
                if (i % 24 === 0 || i === startIdx) {
                    html += `<line x1="${x}" y1="0" x2="${x}" y2="${plotHeight}" class="grid-day" />`;
                    const dateDiv = document.createElement('div');
                    dateDiv.className = 'sticky-date';
                    dateDiv.style.left = `${x}px`;
                    dateDiv.dataset.x = x;
                    
                    const dayIdx = d.getDay();
                    const dayStr = weekDays[dayIdx];
                    let dayColor = (dayIdx === 0) ? "#FF0000" : (dayIdx === 6 ? "#0000FF" : "#000000");

                    if (isLast) {
                        dateDiv.innerHTML = `<span style="color:${dayColor}; font-size:${labelFS * 1.5}px;">${d.getMonth()+1}/${d.getDate()}(${dayStr})</span>`;
                    }
                    dateCont.appendChild(dateDiv);
                } else if (i % 3 === 0) {
                    html += `<line x1="${x}" y1="0" x2="${x}" y2="${plotHeight}" class="grid-3h" />`;
                    if (isLast) {
                        html += `<text x="${x}" y="${plotHeight + 15}" class="label-time" font-size="${labelFS}" text-anchor="middle">${d.getHours()}</text>`;
                    }
                }
            }

            if (fullIdx >= startIdx && fullIdx < 216) {
                const nowX = (fullIdx - startIdx) * hScale;
                html += `<line x1="${nowX}" y1="0" x2="${nowX}" y2="${plotHeight}" class="grid-now" stroke="#0000FF" stroke-width="2" />`;
            }

            datasets.forEach(ds => {
                if (ds.type === 'bar') {
                    for(let i = startIdx; i < 216; i++){
                        const val = ds.data[i] || 0;
                        const h = ((val - min) / range) * plotHeight;
                        const x = (i - startIdx) * hScale;
                        const deg = allData.wind_direction_10m[i];
                        const dirText = getWindDirText(deg);
                        let color = targetWindDirections.includes(dirText) ? (val >= 10.0 ? '#dc143c' : (val >= 5 ? '#ffa500' : '#87ceeb')) : (val >= 10.0 ? 'rgba(220, 20, 60, 0.4)' : '#ccc');
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

        renderSection("svg-wind", "date-wind", [{ data: allData.wind_speed_10m, type: 'bar' }], viewConfig.windHeight, 5.0, true, false);
        renderSection("svg-temps", "date-temp", [{ data: allData.temperature_2m, type: 'line', cls: 'line-temp-air' }, { data: allData.sea_surface_temperature, type: 'line', cls: 'line-temp-sea' }], viewConfig.subHeight, 5.0, false, false);
        renderSection("svg-marine", "date-marine", [{ data: allData.wave_height, type: 'line', cls: 'line-wave' }, { data: allData.sea_level_height_msl, type: 'line', cls: 'line-tide' }], viewConfig.subHeight, 0.5, false, true);

        const scrollRoot = document.getElementById('scroll-root');
        const stage = document.getElementById('stage');
        const guide = document.getElementById('hover-guide');
        const tooltip = document.getElementById('tooltip');

        if (scrollRoot) {
            scrollRoot.onscroll = () => {
                const sl = scrollRoot.scrollLeft;
                document.querySelectorAll('.sticky-date').forEach(el => {
                    const x = parseFloat(el.dataset.x);
                    // 次の日付線(24時間後)までの範囲をhScaleで計算
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

                // hScaleに基づいた正確なインデックス計算
                let hourIdx = Math.round(graphX / hScale) + startIdx;
                hourIdx = Math.min(Math.max(hourIdx, startIdx), 215);

                const snapX = (hourIdx - startIdx) * hScale + 100;
                guide.style.left = snapX + "px"; 
                guide.style.display = "block";
                
                tooltip.style.display = "block";
                
                // ツールチップの位置判定（マウスが画面中央より右なら左側に表示）
                const tooltipWidth = 240;
                let tx;
                if (e.clientX > window.innerWidth / 2) {
                    // 左側に表示
                    tx = e.clientX - tooltipWidth - 20;
                } else {
                    // 右側に表示
                    tx = e.clientX + 20;
                }

                tooltip.style.left = tx + "px";
                tooltip.style.top = (e.clientY + 20) + "px";

                const d = new Date(allData.time[hourIdx]); 
                const weekDays = ["日", "月", "火", "水", "木", "金", "土"];
                const dayStr = weekDays[d.getDay()];
                const deg = allData.wind_direction_10m[hourIdx];
                const ft = new Date();
                const ftStr = `${ft.getHours()}:${ft.getMinutes().toString().padStart(2, '0')}`;

                tooltip.innerHTML = `
                    <span class="spot-name-tip">📍 ${currentLabel}</span>
                    <b>${d.getMonth()+1}/${d.getDate()}(${dayStr}) ${d.getHours()}:00</b>
                    <div style="font-size:11px; color:#aaa; margin-bottom:5px;">取得: ${ftStr}</div>
                    <div class="icon-box"><span class="legend-bar" style="background:#0000FF; margin-right:0;"></span></div>☔降水: ${allData.precipitation ? allData.precipitation[hourIdx]?.toFixed(1) : "0.0"}mm<br>
                    <div class="icon-box"><svg width="14" height="14" viewBox="-8 -15 16 20" style="vertical-align:middle;"><path d="M0,-12 L6,6 L0,2 L-6,6 Z" fill="#00d4ff" stroke="#008eb3" stroke-width="1" transform="rotate(${(deg+180)%360})"/></svg></div>風向: ${getWindDirText(deg)} (${deg}°)<br>
                    <div class="icon-box">🚩</div>風速: ${allData.wind_speed_10m[hourIdx]?.toFixed(1) || "0.0"}m/s<br>
                    <div class="icon-box"><span class="legend-line" style="background:#ff4500; margin-right:0;"></span></div>🌡️気温: ${allData.temperature_2m[hourIdx]?.toFixed(1) || "0.0"}℃<br>
                    <div class="icon-box"><span class="legend-line" style="background:#00ced1; margin-right:0;"></span></div>💧海水: ${allData.sea_surface_temperature ? allData.sea_surface_temperature[hourIdx]?.toFixed(1) : "---"}℃<br>
                    <div class="icon-box"><span class="legend-line" style="background:#2ca02c; margin-right:0;"></span></div>🌊波高: ${allData.wave_height ? allData.wave_height[hourIdx]?.toFixed(2) : "0.00"}m<br>
                    <div class="icon-box"><span class="legend-line" style="background:#1e90ff; margin-right:0;"></span></div>📏潮位: ${allData.sea_level_height_msl ? allData.sea_level_height_msl[hourIdx]?.toFixed(2) : "0.00"}m
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
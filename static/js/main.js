let allData = {};
const hScale = 32;
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
 * スクロール量の二重加算（ダブルカウント）を解消し、表示とデータのズレを修正したコード。
 */
async function draw() {
    try {
        allData = await fetchWithCache(currentLat, currentLon);
        const svgW = document.getElementById('svg-weather');
        if (!svgW) return;
        
        // --- 天気アイコン描画 ---
        let wHtml = "";
        for(let i=0; i<216; i++) {
            const x = i * hScale; 
            const icon = weatherIcons[allData.weather_code[i]] || "❓";
            wHtml += `<text x="${x}" y="32" font-size="28" text-anchor="middle">${icon}</text>`; 
            const p = allData.precipitation ? allData.precipitation[i] : 0;
            if (p > 0) wHtml += `<text x="${x}" y="70" font-size="14" font-weight="bold" fill="#0000FF" text-anchor="middle">${p.toFixed(1)}</text>`;
        }
        svgW.innerHTML = wHtml;

        const now = new Date();
        const nowIdx = allData.time.findIndex(t => new Date(t) > now) - 1;

        // --- 各セクション描画関数 ---
        function renderSection(svgId, dateContId, datasets, height, stepY, isWind = false, isLast = false) {
            const svg = document.getElementById(svgId);
            const dateCont = document.getElementById(dateContId);
            if (!svg || !dateCont) return;
            dateCont.innerHTML = "";
            const allVals = datasets.flatMap(ds => ds.data || []);
            if (allVals.length === 0) return;
            
            let max = Math.ceil(Math.max(...allVals) / stepY) * stepY;
            let min = Math.floor(Math.min(...allVals) / stepY) * stepY;
            if (isWind) min = 0;
            const range = (max - min) || 1;
            const plotHeight = height - 20; 
            let html = "";

            for (let v = min; v <= max; v += stepY) {
                const yPosSvg = plotHeight - (((v - min) / range) * plotHeight);
                html += `<line x1="0" y1="${yPosSvg}" x2="6912" y2="${yPosSvg}" class="grid-y-sub" />`;
            }

            for (let i = 0; i <= 216; i++) {
                const x = i * hScale;
                const d = new Date(allData.time[i]);
                if (i % 24 === 0 && i < 216) {
                    html += `<line x1="${x}" y1="0" x2="${x}" y2="${plotHeight}" class="grid-day" />`;
                    const dateDiv = document.createElement('div');
                    dateDiv.className = 'sticky-date';
                    dateDiv.style.left = `${x}px`;
                    dateDiv.dataset.x = x;
                    
                    const weekDays = ["日", "月", "火", "水", "木", "金", "土"];
                    const dayIdx = d.getDay();
                    const dayStr = weekDays[dayIdx];
                    let dayColor = "#000000"; 
                    if (dayIdx === 0) dayColor = "#FF0000"; 
                    else if (dayIdx === 6) dayColor = "#0000FF"; 

                    if (isLast) {
                        dateDiv.innerHTML = `<span style="color:${dayColor}">${d.getMonth()+1}/${d.getDate()}(${dayStr})</span>`;
                    } else {
                        dateDiv.innerText = ""; 
                    }
                    dateCont.appendChild(dateDiv);
                } else if (i % 3 === 0 && i < 216) {
                    html += `<line x1="${x}" y1="0" x2="${x}" y2="${plotHeight}" class="grid-3h" />`;
                    if (isLast) {
                        html += `<text x="${x}" y="${plotHeight + 15}" class="label-time" text-anchor="middle">${d.getHours()}</text>`;
                    }
                }
            }

            if (nowIdx >= 0 && nowIdx < 216) {
                const nowX = nowIdx * hScale;
                html += `<line x1="${nowX}" y1="0" x2="${nowX}" y2="${plotHeight}" class="grid-now" stroke="#0000FF" stroke-width="2" />`;
            }

            datasets.forEach(ds => {
                if (ds.type === 'bar') {
                    ds.data.forEach((v, i) => {
                        const val = v || 0;
                        const h = ((val - min) / range) * plotHeight;
                        const x = i * hScale;
                        const deg = allData.wind_direction_10m[i];
                        const dirText = getWindDirText(deg);
                        let color = "#ccc"; 
                        if (targetWindDirections.includes(dirText)) {
                            color = val >= 10.0 ? '#dc143c' : (val >= 5 ? '#ffa500' : '#87ceeb');
                        } else {
                            color = val >= 10.0 ? 'rgba(220, 20, 60, 0.4)' : '#ccc';
                        }
                        html += `<rect x="${x - (hScale*0.4)}" y="${plotHeight-h}" width="${hScale*0.8}" height="${h}" fill="${color}" />`;
                        if (isWind) {
                            const rot = (deg + 180) % 360;
                            html += `<path d="M0,-12 L6,6 L0,2 L-6,6 Z" transform="translate(${x}, ${plotHeight-h-25}) rotate(${rot}) scale(1.6)" class="wind-arrow" />`;
                        }
                    });
                } else {
                    const pts = (ds.data || []).map((v, i) => `${i * hScale},${plotHeight - (((v || 0) - min) / range) * plotHeight}`).join(" ");
                    html += `<polyline class="${ds.cls}" points="${pts}" />`;
                }
            });
            svg.innerHTML = html;
        }

        // --- 全セクション描画実行 ---
        renderSection("svg-wind", "date-wind", [{ data: allData.wind_speed_10m, type: 'bar' }], 280, 5.0, true, false);
        renderSection("svg-temps", "date-temp", [{ data: allData.temperature_2m, type: 'line', cls: 'line-temp-air' }, { data: allData.sea_surface_temperature, type: 'line', cls: 'line-temp-sea' }], 160, 5.0, false, false);
        renderSection("svg-marine", "date-marine", [{ data: allData.wave_height, type: 'line', cls: 'line-wave' }, { data: allData.sea_level_height_msl, type: 'line', cls: 'line-tide' }], 160, 0.5, false, true);

        // --- インタラクション制御 ---
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
                    el.style.left = (sl >= x && sl < nextX - 80) ? (sl - 100) + "px" : x + "px";
                });
            };
        }

        if (stage && guide && tooltip) {
            stage.onmousemove = (e) => {
                const rect = stage.getBoundingClientRect();
                
                // e.clientX - rect.left の時点ですでに「stage内の絶対座標」になります。
                // scrollLeft の二重加算を削除し、純粋にラベル幅(100)だけを引きます。
                const graphX = (e.clientX - rect.left) - 100;

                if (graphX < 0) {
                    guide.style.display = "none";
                    tooltip.style.display = "none";
                    return;
                }

                let hourIdx = Math.round(graphX / hScale);
                if (hourIdx < 0) hourIdx = 0;
                if (hourIdx >= 216) hourIdx = 215;

                // ガイド線の位置（stage内の絶対座標）
                const snapX = (hourIdx * hScale) + 100;
                guide.style.left = snapX + "px"; 
                guide.style.display = "block";
                
                tooltip.style.display = "block";
                
                // ツールチップ位置（画面上の座標）
                let tx = e.clientX + 20;
                if (tx + 220 > window.innerWidth) tx = e.clientX - 240;
                tooltip.style.left = tx + "px";
                tooltip.style.top = (e.clientY + 20) + "px";

                const d = new Date(allData.time[hourIdx]); 
                const deg = allData.wind_direction_10m[hourIdx];
                const ws = allData.wind_speed_10m[hourIdx];

                tooltip.innerHTML = `
                    <span class="spot-name-tip">📍 ${currentLabel}</span>
                    <b>${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:00</b>
                    <div class="icon-box"><span class="legend-bar" style="background:#0000FF; margin-right:0;"></span></div>☔降水: ${allData.precipitation ? allData.precipitation[hourIdx]?.toFixed(1) : "0.0"}mm<br>
                    <div class="icon-box"><svg width="14" height="14" viewBox="-8 -15 16 20" style="vertical-align:middle;"><path d="M0,-12 L6,6 L0,2 L-6,6 Z" fill="#00d4ff" stroke="#008eb3" stroke-width="1" transform="rotate(${(deg+180)%360})"/></svg></div>風向: ${getWindDirText(deg)} (${deg}°)<br>
                    <div class="icon-box">🚩</div>風速: ${ws?.toFixed(1) || "0.0"}m/s<br>
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



initApp();
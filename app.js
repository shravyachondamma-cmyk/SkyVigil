// =========================================================================
// SkyVigil - Global Air & Climate Intelligence Platform - Core Application Logic
// Real-World Telemetry, AI Vision Smoke Analysis & Sliding Window Architecture
// =========================================================================

// --- Global State Variables ---
let socket = null;
let map = null;
let allCorridorMarkersGroup = null;
let aodLayerGroup = null;
let plumeDriftGroup = null;
let citizenMarkersGroup = null;
let hotspotMarkersGroup = null;

let isAODActive = true;
let isPlumeDriftActive = false;
let isHotspotActive = true;
let yoyBaselineActive = false;

let trendChartInstance = null;
let sourceChartInstance = null;

let currentWindowIndex = 0;
const totalWindows = 5;

let currentCorridorKey = 'Delhi';
let selectedCountryCode = 'IND';
let selectedCountryName = 'India';
let currentLanguage = 'en';
let currentAirQuality = { usAqi: 242, pm25: 54.6, pm10: 110.2, no2: 42.1, so2: 18.5, co: 0.85, ozone: 32.0, dust: 291.0, aod: 0.550 };
let currentWeather = { temperature: 28, humidity: 48, windSpeed: 12.4, windDirection: 240, pressure: 1012 };
let currentWorldBank = {};
let currentHotspots = [];
let currentFederatedModels = [];
let currentSharedResources = [];
let activePollutantVector = 'PM2.5';
let satelliteCountdown = 10;
let satelliteInterval = null;
let currentCustomImageBase64 = null;
let dashboardStarted = false;

const API_BASE_URL = window.location.protocol === 'file:' ? 'http://localhost:4000' : '';
const apiUrl = (path) => `${API_BASE_URL}${path}`;

// --- Authentic Environmental SVG Visual Assets (Zero External Broken Image Redirections) ---
const samplePhotoPresets = {
    'agricultural_burning': {
        svg: `<svg viewBox="0 0 400 160" class="w-full h-full object-cover">
            <defs>
                <linearGradient id="sky1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#451a03"/><stop offset="60%" stop-color="#7c2d12"/><stop offset="100%" stop-color="#ca8a04"/></linearGradient>
                <radialGradient id="fireGlow" cx="50%" cy="80%" r="50%"><stop offset="0%" stop-color="#ef4444" stop-opacity="0.9"/><stop offset="50%" stop-color="#f59e0b" stop-opacity="0.6"/><stop offset="100%" stop-color="#7c2d12" stop-opacity="0"/></radialGradient>
            </defs>
            <rect width="400" height="160" fill="url(#sky1)"/>
            <path d="M0 110 Q 100 100, 200 115 T 400 110 L 400 160 L 0 160 Z" fill="#78350f"/>
            <path d="M0 125 Q 120 120, 250 130 T 400 125 L 400 160 L 0 160 Z" fill="#451a03"/>
            <rect x="0" y="105" width="400" height="40" fill="url(#fireGlow)"/>
            <path d="M40 125 Q 60 105, 80 125 T 120 125 T 160 125 T 200 120 T 260 125 T 320 120 T 380 125" stroke="#ef4444" stroke-width="4" fill="none"/>
            <path d="M50 125 Q 70 112, 90 125 T 130 125 T 170 122 T 210 125 T 270 122 T 330 125 T 370 125" stroke="#fbbf24" stroke-width="2.5" fill="none"/>
            <circle cx="90" cy="80" r="45" fill="#334155" opacity="0.75"/>
            <circle cx="140" cy="65" r="55" fill="#1e293b" opacity="0.8"/>
            <circle cx="200" cy="50" r="65" fill="#0f172a" opacity="0.85"/>
            <circle cx="280" cy="55" r="60" fill="#1e293b" opacity="0.8"/>
            <circle cx="340" cy="70" r="50" fill="#334155" opacity="0.75"/>
            <circle cx="200" cy="75" r="22" stroke="#10b981" stroke-width="1.5" stroke-dasharray="3,3" fill="none"/>
            <line x1="170" y1="75" x2="230" y2="75" stroke="#10b981" stroke-width="1"/>
            <line x1="200" y1="45" x2="200" y2="105" stroke="#10b981" stroke-width="1"/>
        </svg>`,
        label: '<i class="fa-solid fa-fire text-amber-400 mr-1"></i> Agricultural Crop Stubble Fire',
        categoryHint: 'agricultural_burning'
    },
    'industrial_flare': {
        svg: `<svg viewBox="0 0 400 160" class="w-full h-full object-cover">
            <defs>
                <linearGradient id="sky2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#020617"/><stop offset="70%" stop-color="#0f172a"/><stop offset="100%" stop-color="#1e1b4b"/></linearGradient>
            </defs>
            <rect width="400" height="160" fill="url(#sky2)"/>
            <rect x="30" y="110" width="70" height="50" fill="#090d16"/>
            <polygon points="40,110 65,80 90,110" fill="#090d16"/>
            <rect x="120" y="90" width="100" height="70" fill="#090d16"/>
            <rect x="250" y="45" width="12" height="115" fill="#1e293b"/>
            <rect x="290" y="60" width="10" height="100" fill="#1e293b"/>
            <rect x="320" y="75" width="14" height="85" fill="#1e293b"/>
            <path d="M256 45 Q 262 20, 256 12 Q 250 20, 256 45" fill="#f97316"/>
            <path d="M256 45 Q 259 28, 256 22 Q 253 28, 256 45" fill="#fef08a"/>
            <circle cx="260" cy="25" r="28" fill="#334155" opacity="0.6"/>
            <circle cx="275" cy="18" r="35" fill="#475569" opacity="0.5"/>
            <circle cx="310" cy="12" r="45" fill="#64748b" opacity="0.4"/>
            <rect x="240" y="10" width="32" height="40" stroke="#f43f5e" stroke-width="1.5" fill="none" stroke-dasharray="2,2"/>
        </svg>`,
        label: '<i class="fa-solid fa-industry text-rose-400 mr-1"></i> Industrial Smelter / Flare Stack',
        categoryHint: 'industrial_flare'
    },
    'vehicular_inversion': {
        svg: `<svg viewBox="0 0 400 160" class="w-full h-full object-cover">
            <defs>
                <linearGradient id="sky3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1e293b"/><stop offset="50%" stop-color="#475569"/><stop offset="100%" stop-color="#78716c"/></linearGradient>
            </defs>
            <rect width="400" height="160" fill="url(#sky3)"/>
            <rect x="40" y="50" width="35" height="110" fill="#334155" opacity="0.4"/>
            <rect x="85" y="30" width="45" height="130" fill="#334155" opacity="0.5"/>
            <rect x="140" y="60" width="30" height="100" fill="#334155" opacity="0.4"/>
            <rect x="0" y="70" width="400" height="90" fill="#eab308" opacity="0.25"/>
            <polygon points="120,160 180,105 220,105 280,160" fill="#0f172a"/>
            <line x1="200" y1="105" x2="200" y2="160" stroke="#facc15" stroke-width="2" stroke-dasharray="8,8"/>
            <circle cx="185" cy="125" r="4" fill="#f43f5e"/>
            <circle cx="195" cy="125" r="4" fill="#f43f5e"/>
            <circle cx="210" cy="140" r="5" fill="#fef08a"/>
            <circle cx="225" cy="140" r="5" fill="#fef08a"/>
        </svg>`,
        label: '<i class="fa-solid fa-car-side text-yellow-400 mr-1"></i> Dense Highway Smog Inversion',
        categoryHint: 'vehicular_inversion'
    },
    'wildfire': {
        svg: `<svg viewBox="0 0 400 160" class="w-full h-full object-cover">
            <defs>
                <linearGradient id="sky4" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#450a0a"/><stop offset="50%" stop-color="#991b1b"/><stop offset="100%" stop-color="#ea580c"/></linearGradient>
            </defs>
            <rect width="400" height="160" fill="url(#sky4)"/>
            <polygon points="0,160 80,90 180,160" fill="#14532d" opacity="0.8"/>
            <polygon points="120,160 220,70 320,160" fill="#052e16"/>
            <polygon points="260,160 340,95 400,160" fill="#14532d" opacity="0.8"/>
            <path d="M160 110 Q 180 85, 200 105 T 240 100 T 280 115" stroke="#f97316" stroke-width="6" fill="none"/>
            <path d="M170 110 Q 190 92, 210 105 T 250 102 T 270 115" stroke="#fef08a" stroke-width="3" fill="none"/>
            <circle cx="200" cy="50" r="40" fill="#475569" opacity="0.75"/>
            <circle cx="240" cy="40" r="48" fill="#334155" opacity="0.8"/>
            <circle cx="290" cy="30" r="55" fill="#1e293b" opacity="0.85"/>
        </svg>`,
        label: '<i class="fa-solid fa-tree text-rose-500 mr-1"></i> Forest Wildfire & Biomass Plume',
        categoryHint: 'wildfire'
    }
};

// --- BRICS+ Corridors Configuration (10 Nations, 13 Economic Corridors) ---
const corridorsData = {
    'Delhi': {
        id: 'Delhi',
        name: 'New Delhi National Capital Region',
        country: 'India',
        countryCode: 'IND',
        regionGroup: 'Asia',
        flag: '🇮🇳',
        region: 'Indo-Gangetic Plain Megacity',
        lat: 28.6139,
        lon: 77.2090,
        waqiKey: 'delhi',
        baseAqi: 242,
        dominantPollutant: 'PM2.5 (Stubble & Inversion)',
        treatyTargetPct: 45,
        defaultSources: { 'Industrial Emission': 35, 'Vehicular Transport': 38, 'Agricultural Biomass': 17, 'Construction Dust': 10 }
    },
    'Mumbai': {
        id: 'Mumbai',
        name: 'Mumbai Coastal Corridor',
        country: 'India',
        countryCode: 'IND',
        regionGroup: 'Asia',
        flag: '🇮🇳',
        region: 'Western Seaboard Maritime Hub',
        lat: 19.0760,
        lon: 72.8777,
        waqiKey: 'mumbai',
        baseAqi: 118,
        dominantPollutant: 'PM10 (Coastal & Traffic)',
        treatyTargetPct: 40,
        defaultSources: { 'Industrial Operations': 30, 'Vehicular Traffic': 42, 'Maritime Shipping': 18, 'Urban Construction': 10 }
    },
    'Beijing': {
        id: 'Beijing',
        name: 'Beijing-Tianjin-Hebei Corridor',
        country: 'China',
        countryCode: 'CHN',
        regionGroup: 'Asia',
        flag: '🇨🇳',
        region: 'North China Industrial Plain',
        lat: 39.9042,
        lon: 116.4074,
        waqiKey: 'beijing',
        baseAqi: 162,
        dominantPollutant: 'NO₂ & PM2.5 (Heavy Smelter)',
        treatyTargetPct: 50,
        defaultSources: { 'Heavy Industry': 44, 'Vehicular Transport': 26, 'Thermal Energy': 20, 'Domestic Heating': 10 }
    },
    'Shanghai': {
        id: 'Shanghai',
        name: 'Shanghai Yangtze Delta Corridor',
        country: 'China',
        countryCode: 'CHN',
        regionGroup: 'Asia',
        flag: '🇨🇳',
        region: 'Eastern Coastal Megalopolis',
        lat: 31.2304,
        lon: 121.4737,
        waqiKey: 'shanghai',
        baseAqi: 94,
        dominantPollutant: 'O₃ & VOCs (Port & Petrochem)',
        treatyTargetPct: 45,
        defaultSources: { 'Manufacturing & Petrochem': 40, 'Port Logistics': 25, 'Vehicular Fleet': 25, 'Construction': 10 }
    },
    'Sao Paulo': {
        id: 'Sao Paulo',
        name: 'São Paulo Industrial Megacity',
        country: 'Brazil',
        countryCode: 'BRA',
        regionGroup: 'Americas',
        flag: '🇧🇷',
        region: 'Southeastern Industrial Belt',
        lat: -23.5505,
        lon: -46.6333,
        waqiKey: 'sao-paulo',
        baseAqi: 54,
        dominantPollutant: 'Vehicular NOx & Ethanol Smog',
        treatyTargetPct: 35,
        defaultSources: { 'Vehicular Fleet (Ethanol/Gas)': 55, 'Industrial Boilers': 25, 'Regional Biomass Burning': 12, 'Construction Dust': 8 }
    },
    'Manaus': {
        id: 'Manaus',
        name: 'Manaus Amazon Bio-Climate Basin',
        country: 'Brazil',
        countryCode: 'BRA',
        regionGroup: 'Americas',
        flag: '🇧🇷',
        region: 'Amazon Rainforest Ecological Zone',
        lat: -3.1190,
        lon: -60.0217,
        waqiKey: 'manaus',
        baseAqi: 38,
        dominantPollutant: 'Biomass Pyrolysis Trace',
        treatyTargetPct: 50,
        defaultSources: { 'Biomass Wildfire Smoke': 60, 'Free Trade Industrial Zone': 18, 'River & Road Transport': 14, 'Other': 8 }
    },
    'Moscow': {
        id: 'Moscow',
        name: 'Moscow Central Industrial Region',
        country: 'Russia',
        countryCode: 'RUS',
        regionGroup: 'Eurasia',
        flag: '🇷🇺',
        region: 'European Russia Metropolitan Zone',
        lat: 55.7558,
        lon: 37.6173,
        waqiKey: 'moscow',
        baseAqi: 68,
        dominantPollutant: 'NO₂ & Gas District Heating',
        treatyTargetPct: 40,
        defaultSources: { 'District Heating & Power': 42, 'Urban Vehicular Traffic': 34, 'Chemical & Manufacturing': 18, 'Construction': 6 }
    },
    'Johannesburg': {
        id: 'Johannesburg',
        name: 'Gauteng Mining & Industrial Corridor',
        country: 'South Africa',
        countryCode: 'ZAF',
        regionGroup: 'Africa',
        flag: '🇿🇦',
        region: 'Highveld Plateau Industrial Node',
        lat: -26.2041,
        lon: 28.0473,
        waqiKey: 'johannesburg',
        baseAqi: 210,
        dominantPollutant: 'SO₂ & Coal Ash Flue Gas',
        treatyTargetPct: 40,
        defaultSources: { 'Coal-Fired Power Plants': 48, 'Mine Tailings & Smelting': 26, 'Heavy Transport': 18, 'Mineral Dust': 8 }
    },
    'Cairo': {
        id: 'Cairo',
        name: 'Greater Cairo Nile Delta Corridor',
        country: 'Egypt',
        countryCode: 'EGY',
        regionGroup: 'MENA',
        flag: '🇪🇬',
        region: 'Nile Basin & North African Gateway',
        lat: 30.0444,
        lon: 31.2357,
        waqiKey: 'cairo',
        baseAqi: 175,
        dominantPollutant: 'Mineral Aeolian Dust & Straw',
        treatyTargetPct: 35,
        defaultSources: { 'Desert Aeolian Dust': 38, 'Urban Vehicular Fleet': 32, 'Delta Industrial Belt': 22, 'Agricultural Burning': 8 }
    },
    'Addis Ababa': {
        id: 'Addis Ababa',
        name: 'Addis Ababa Clean Energy Hub',
        country: 'Ethiopia',
        countryCode: 'ETH',
        regionGroup: 'Africa',
        flag: '🇪🇹',
        region: 'Horn of Africa Clean Energy Belt',
        lat: 9.0320,
        lon: 38.7480,
        waqiKey: 'addis-ababa',
        baseAqi: 42,
        dominantPollutant: 'Domestic Biomass Inversion',
        treatyTargetPct: 50,
        defaultSources: { 'Biomass Cooking & Heating': 45, 'Urban Road Transport': 35, 'Infrastructure Construction': 12, 'Light Industry': 8 }
    },
    'Tehran': {
        id: 'Tehran',
        name: 'Tehran Alborz Basin Corridor',
        country: 'Iran',
        countryCode: 'IRN',
        regionGroup: 'MENA',
        flag: '🇮🇷',
        region: 'Persian Highland Inversion Basin',
        lat: 35.6892,
        lon: 51.3890,
        waqiKey: 'tehran',
        baseAqi: 188,
        dominantPollutant: 'Dense Topographical Inversion',
        treatyTargetPct: 40,
        defaultSources: { 'Vehicular Inversion Fleet': 52, 'Refineries & Industry': 28, 'Domestic Gas Heating': 14, 'Topographical Dust': 6 }
    },
    'Abu Dhabi': {
        id: 'Abu Dhabi',
        name: 'Abu Dhabi-Dubai Clean Tech Belt',
        country: 'UAE',
        countryCode: 'ARE',
        regionGroup: 'MENA',
        flag: '🇦🇪',
        region: 'Arabian Gulf Solar & Innovation Node',
        lat: 24.4539,
        lon: 54.3773,
        waqiKey: 'abu-dhabi',
        baseAqi: 132,
        dominantPollutant: 'Desert Dust & Desalination NOx',
        treatyTargetPct: 50,
        defaultSources: { 'Mineral Desert Dust': 42, 'Industrial Desalination & Energy': 30, 'Highway Transport': 20, 'Maritime Shipping': 8 }
    },
    'Riyadh': {
        id: 'Riyadh',
        name: 'Riyadh Green Megacity Zone',
        country: 'Saudi Arabia',
        countryCode: 'SAU',
        regionGroup: 'MENA',
        flag: '🇸🇦',
        region: 'Central Arabian Sustainable Growth Hub',
        lat: 24.7136,
        lon: 46.6753,
        waqiKey: 'riyadh',
        baseAqi: 145,
        dominantPollutant: 'Coarse Mineral Sand Aerosol',
        treatyTargetPct: 45,
        defaultSources: { 'Aeolian Mineral Dust': 45, 'Highway Logistics': 28, 'Industrial Power Generation': 22, 'Urban Expansion': 5 }
    }
};

// --- Total Page Multi-Language Translation Dictionaries ---
const i18nDictionary = {
    en: {
        headerTitle: "SkyVigil",
        headerBadge: "AI FEDERATED GRID",
        headerSubtitle: "Hyper-Local Hotspot Detection • Cross-Border Spike Forecasting • Model Mesh",
        navBrief: "Ministerial Brief",
        tabLabel0: "1. Observation & Map",
        tabLabel1: "2. AI Vision & Hotspots",
        tabLabel2: "3. Spike Forecast & Trends",
        tabLabel3: "4. Leaderboard & Health",
        tabLabel4: "5. Model Mesh & Governance",
        corridorsTitle: "BRICS+ Member Corridors",
        filterAll: "All",
        filterAsia: "Asia",
        filterAmericas: "Americas",
        filterEurasia: "Eurasia",
        filterAfrica: "Africa",
        filterMena: "MENA",
        aiVisionTitle: "AI Smoke & Photo Ingestion Viewfinder",
        aiVisionDesc: "Upload or sample citizen photos to detect crop residue burning, industrial flare stacks, or dense smog plumes.",
        scenarioLabel: "Select Scenario or Upload Photo",
        scenario1: "🔥 Scenario 1: Agricultural Stubble Burning",
        scenario2: "🏭 Scenario 2: Unmonitored Industrial Flare Stack",
        scenario3: "🚗 Scenario 3: Dense Highway Smog Inversion",
        scenario4: "🌲 Scenario 4: Forest Wildfire & Biomass Plume",
        btnUploadCustom: "Upload Custom",
        btnRunScan: "Run AI Scan",
        lblResultSource: "Detected Source:",
        lblResultOpacity: "Visual Smoke Opacity:",
        lblResultAqi: "Estimated Equiv AQI:",
        lblResultConf: "AI Confidence:",
        healthTitle: "Health & Socio-Economic Impact",
        healthLabelEr: "Respiratory ER Strain:",
        healthLabelPed: "Pediatric Admissions:",
        healthLabelLoss: "Productivity Loss:",
        healthLabelMort: "Avoidable Mortality Burden:",
        webhookTitle: "Emergency Webhook Dispatcher",
        webhookMinisterial: "Ministerial Throttling Dispatch",
        webhookDesc: "Trigger automated emergency traffic & industrial restriction protocols across member municipalities.",
        btnDispatchStage3: "Dispatch Stage-3 Webhook",
        satBannerTitle: "SkyVigil Constellation & Copernicus AOD Sync",
        satBannerDesc: "Continuous aerosol optical depth telemetry from joint remote sensing satellite constellation.",
        satLiveLabel: "Live Satellite AOD",
        btnSyncSat: "Sync",
        hotspotRadarTitle: "Hidden Hotspot & Cross-Border Anomaly Radar",
        hotspotRadarDesc: "Identifies hidden unmonitored clusters (illegal nighttime flaring, crop burning, transboundary plumes) by merging citizen ground photos with satellite remote sensing.",
        spikeForecastTitle: "AI Air Quality Spike Forecasting Engine",
        spikeForecastDesc: "Projects thermal inversion trapping and transboundary plume convergence across 6h, 12h, and 24h horizons.",
        leaderboardTitle: "Real-Time SkyVigil Air Quality Leaderboard & Ranking",
        leaderboardDesc: "Live comparative index across all member capitals and economic nodes.",
        mapSectionTitle: "Geospatial Corridor & Hotspot Plume Tracking",
        lblHotspotToggleOn: "Hotspot Radar: ON",
        lblHotspotToggleOff: "Hotspot Radar: OFF",
        lblAodToggle: "Satellite AOD Layer",
        plumeDriftTitle: "Transboundary Plume Drift Simulator",
        btnPlumeDriftEnable: "Enable 3h Plume Drift",
        btnPlumeDriftDisable: "Disable 3h Plume Drift",
        matrixTitle: "Multi-Pollutant Real-World Matrix",
        matrixSubtitle: "Click a vector to inspect",
        lblActiveVector: "Active Vector",
        lblLiveConc: "Live Concentration",
        lblLastSync: "Last Synchronized",
        meshTitle: "SkyVigil Federated ML Model Mesh & Shared Resources",
        meshDesc: "Interoperable cross-border exchange of transfer learning weights and mitigation assets across BRICS+ nodes.",
        btnSyncAllModels: "Sync All ML Weights",
        resourcesTitle: "Cross-Border Emergency Mitigation Assets",
        policyAdvisorTitle: "AI Policy Advisor Directive",
        treatySimTitle: "BRICS Multilateral Treaty Emission Reduction Simulator",
        lblTreatyBaseline: "Current Baseline (0%)",
        lblTreatyModerate: "Treaty Compliance (-25%)",
        lblTreatyAggressive: "Aggressive Net-Zero (-50%)",
        chartTrendTitle: "7-Day Trend & Projection (Open-Meteo)",
        chartSourceTitle: "Source Attribution",
        btnExportCsv: "CSV",
        btnExportJson: "JSON",
        terminalTitle: "Federated Multi-National Dispatch & Event Log",
        btnClearLog: "Clear Log",
        footerText: "SkyVigil • Global Clean Air Intelligence • Powered by Open-Access Environmental APIs, AI Vision & Federated Citizen Sensor Nodes"
    },
    zh: {
        headerTitle: "金砖国家气候智能平台",
        headerBadge: "AI 联邦网格",
        headerSubtitle: "超本地污染热点监测 • 跨国雾霾预测 • 模型联邦共享",
        navBrief: "部长级简报",
        tabLabel0: "1. 综合监测与地图",
        tabLabel1: "2. AI视觉与热点雷达",
        tabLabel2: "3. 峰值预测与趋势",
        tabLabel3: "4. 排行榜与健康影响",
        tabLabel4: "5. 联邦模型与治理",
        corridorsTitle: "金砖+ 经济走廊",
        filterAll: "全部",
        filterAsia: "亚洲",
        filterAmericas: "美洲",
        filterEurasia: "欧亚",
        filterAfrica: "非洲",
        filterMena: "中东与北非",
        aiVisionTitle: "AI 烟尘图像智能摄入分析",
        aiVisionDesc: "上传或采样公众拍摄照片，智能检测秸秆焚烧、工业火炬与重度雾霾。",
        scenarioLabel: "选择预设场景或上传照片",
        scenario1: "🔥 场景 1: 农田秸秆露天焚烧",
        scenario2: "🏭 场景 2: 未受规管的工业冶炼排放",
        scenario3: "🚗 场景 3: 交通干线重度柴油烟雾逆温",
        scenario4: "🌲 场景 4: 森林生物质野火烟羽",
        btnUploadCustom: "上传自定义照片",
        btnRunScan: "运行 AI 扫描",
        lblResultSource: "检测排放源:",
        lblResultOpacity: "烟雾光学不透明度:",
        lblResultAqi: "估算等效 AQI:",
        lblResultConf: "AI 置信度:",
        healthTitle: "公共健康与社会经济影响",
        healthLabelEr: "呼吸科急诊负荷:",
        healthLabelPed: "儿科入院人数:",
        healthLabelLoss: "经济生产力损失:",
        healthLabelMort: "可避免死亡负担:",
        webhookTitle: "紧急 Webhook 调度中心",
        webhookMinisterial: "部长级应急限流指令",
        webhookDesc: "触发成员城市间跨国紧急交通与工业减排联动机制。",
        btnDispatchStage3: "调度三级应急 Webhook",
        satBannerTitle: "金砖卫星星座与哥白尼 AOD 遥感同步",
        satBannerDesc: "基于金砖联合遥感卫星星座持续刷新气溶胶光学厚度遥感数据。",
        satLiveLabel: "实时卫星 AOD",
        btnSyncSat: "同步",
        hotspotRadarTitle: "隐匿污染热点与跨界异常雷达",
        hotspotRadarDesc: "融合地面公众照片与卫星遥感热异常，自动捕获夜间非法排污与秸秆火点。",
        spikeForecastTitle: "AI 空气质量峰值预测引擎",
        spikeForecastDesc: "结合逆温层高度与跨界风场，精准预测未来 6h、12h、24h 污染突增峰值。",
        leaderboardTitle: "金砖国家实时空气质量排行榜",
        leaderboardDesc: "所有成员国首都与主要经济走廊的实时空气质量对比指数。",
        mapSectionTitle: "地理空间走廊与烟羽追踪地图",
        lblHotspotToggleOn: "热点雷达: 开启",
        lblHotspotToggleOff: "热点雷达: 关闭",
        lblAodToggle: "卫星 AOD 遥感图层",
        plumeDriftTitle: "跨界烟羽漂移模拟器",
        btnPlumeDriftEnable: "启用 3小时漂移投影",
        btnPlumeDriftDisable: "关闭 3小时漂移投影",
        matrixTitle: "多组分气体实时矩阵",
        matrixSubtitle: "点击向量以检查详情",
        lblActiveVector: "当前监测向量",
        lblLiveConc: "实时浓度读数",
        lblLastSync: "最后同步时间",
        meshTitle: "金砖联邦机器学习网格与应急资源共享",
        meshDesc: "金砖国家间跨国迁移学习模型权重与应急减排装备的互操作共享库。",
        btnSyncAllModels: "同步全部模型权重",
        resourcesTitle: "跨国共享应急减排装备",
        policyAdvisorTitle: "AI 气候政策专家指令",
        treatySimTitle: "金砖多边公约减排目标模拟器",
        lblTreatyBaseline: "当前基准线 (0%)",
        lblTreatyModerate: "公约履约减排 (-25%)",
        lblTreatyAggressive: "进取型净零目标 (-50%)",
        chartTrendTitle: "7天趋势与预测 (Open-Meteo)",
        chartSourceTitle: "污染源归因分析",
        btnExportCsv: "CSV",
        btnExportJson: "JSON",
        terminalTitle: "金砖联邦多国调度与事件流",
        btnClearLog: "清空日志",
        footerText: "金砖国家可持续基础设施与全球清洁空气倡议 • 由开放环境 API、AI 视觉及联邦传感器网络驱动"
    },
    hi: {
        headerTitle: "ब्रिक्स+ जलवायु आसूचना मंच",
        headerBadge: "AI फेडेरेटेड ग्रिड",
        headerSubtitle: "अति-स्थानीय हॉटस्पॉट पहचान • सीमा-पार प्रदूषण पूर्वानुमान • मॉडल मेश",
        navBrief: "मंत्रालयी ब्रीफ",
        tabLabel0: "1. अवलोकन एवं मानचित्र",
        tabLabel1: "2. AI विज़न एवं हॉटस्पॉट",
        tabLabel2: "3. स्पाइक पूर्वानुमान",
        tabLabel3: "4. लीडरबोर्ड एवं स्वास्थ्य",
        tabLabel4: "5. मॉडल मेश एवं शासन",
        corridorsTitle: "ब्रिक्स+ सदस्य गलियारे",
        filterAll: "सभी",
        filterAsia: "एशिया",
        filterAmericas: "अमेरिका",
        filterEurasia: "यूरेशिया",
        filterAfrica: "अफ्रीका",
        filterMena: "मध्य पूर्व/उत्तरी अफ्रीका",
        aiVisionTitle: "AI विज़न धुआं एवं फोटो अंतर्ग्रहण",
        aiVisionDesc: "पराली दहन, औद्योगिक उत्सर्जन या घने स्मॉग का पता लगाने के लिए नागरिक तस्वीरें अपलोड या स्कैन करें।",
        scenarioLabel: "परिदृश्य चुनें या फोटो अपलोड करें",
        scenario1: "🔥 परिदृश्य 1: कृषि पराली दहन",
        scenario2: "🏭 परिदृश्य 2: अनियंत्रित औद्योगिक भट्टी उत्सर्जन",
        scenario3: "🚗 परिदृश्य 3: राजमार्ग डीजल स्मॉग इनवर्जन",
        scenario4: "🌲 परिदृश्य 4: वन बायोमास वाइल्डफायर",
        btnUploadCustom: "कस्टम फोटो अपलोड करें",
        btnRunScan: "AI स्कैन चलाएं",
        lblResultSource: "पहचाना गया स्रोत:",
        lblResultOpacity: "दृश्यमान धुआं अपारदर्शिता:",
        lblResultAqi: "अनुमानित AQI मान:",
        lblResultConf: "AI विश्वास स्कोर:",
        healthTitle: "स्वास्थ्य एवं सामाजिक-आर्थिक प्रभाव",
        healthLabelEr: "श्वसन ER तनाव:",
        healthLabelPed: "बाल चिकित्सा प्रवेश:",
        healthLabelLoss: "उत्पादकता हानि:",
        healthLabelMort: "रोकथाम योग्य मृत्यु भार:",
        webhookTitle: "आपातकालीन वेबहुक डिस्पैचर",
        webhookMinisterial: "मंत्रालयी थ्रॉटलिंग डिस्पैच",
        webhookDesc: "सदस्य नगर पालिकाओं में स्वचालित आपातकालीन यातायात और औद्योगिक प्रतिबंध प्रोटोकॉल ट्रिगर करें।",
        btnDispatchStage3: "चरण-3 वेबहुक डिस्पैच करें",
        satBannerTitle: "ब्रिक्स उपग्रह समूह एवं कोपरनिकस AOD सिंक",
        satBannerDesc: "संयुक्त उपग्रह समूह से लगातार एरोसोल ऑप्टिकल गहराई टेलीमेट्री अपडेट।",
        satLiveLabel: "लाइव सैटेलाइट AOD",
        btnSyncSat: "सिंक करें",
        hotspotRadarTitle: "छिपे हुए हॉटस्पॉट और सीमा-पार विसंगति रडार",
        hotspotRadarDesc: "नागरिक तस्वीरों और उपग्रह थर्मल डेटा को मिलाकर अवैध रात के उत्सर्जन और पराली दहन का पता लगाएं।",
        spikeForecastTitle: "AI वायु गुणवत्ता स्पाइक पूर्वानुमान इंजन",
        spikeForecastDesc: "थर्मल इनवर्जन और सीमा-पार हवा के आधार पर 6h, 12h, 24h में प्रदूषण वृद्धि का सटीक पूर्वानुमान।",
        leaderboardTitle: "ब्रिक्स+ रीयल-टाइम वायु गुणवत्ता लीडरबोर्ड",
        leaderboardDesc: "सभी सदस्य राजधानियों और आर्थिक गलियारों का लाइव तुलनात्मक सूचकांक।",
        mapSectionTitle: "भौगोलिक गलियारा एवं हॉटस्पॉट ट्रैकिंग मानचित्र",
        lblHotspotToggleOn: "हॉटस्पॉट रडार: सक्रिय",
        lblHotspotToggleOff: "हॉटस्पॉट रडार: बंद",
        lblAodToggle: "सैटेलाइट AOD परत",
        plumeDriftTitle: "सीमा-पार स्मॉग ड्रिफ्ट सिम्युलेटर",
        btnPlumeDriftEnable: "3 घंटे का ड्रिफ्ट सक्षम करें",
        btnPlumeDriftDisable: "3 घंटे का ड्रिफ्ट बंद करें",
        matrixTitle: "मल्टी-प्रदूषक गैस मैट्रिक्स",
        matrixSubtitle: "विवरण देखने के लिए क्लिक करें",
        lblActiveVector: "सक्रिय प्रदूषक",
        lblLiveConc: "लाइव सांद्रता",
        lblLastSync: "अंतिम सिंक समय",
        meshTitle: "ब्रिक्स फेडेरेटेड ML मॉडल मेश एवं साझा संसाधन",
        meshDesc: "ब्रिक्स देशों के बीच ट्रांसफर लर्निंग मॉडल और आपातकालीन उपकरण साझा करने का केंद्रीय हब।",
        btnSyncAllModels: "सभी मॉडल भार सिंक करें",
        resourcesTitle: "सीमा-पार आपातकालीन शमन उपकरण",
        policyAdvisorTitle: "AI नीति सलाहकार निर्देश",
        treatySimTitle: "ब्रिक्स बहुपक्षीय संधि उत्सर्जन कमी सिम्युलेटर",
        lblTreatyBaseline: "वर्तमान आधार रेखा (0%)",
        lblTreatyModerate: "संधि अनुपालन (-25%)",
        lblTreatyAggressive: "शुद्ध-शून्य लक्ष्य (-50%)",
        chartTrendTitle: "7-दिवसीय रुझान और पूर्वानुमान (Open-Meteo)",
        chartSourceTitle: "प्रदूषण स्रोत विभाजन",
        btnExportCsv: "CSV",
        btnExportJson: "JSON",
        terminalTitle: "ब्रिक्स बहुराष्ट्रीय डिस्पैच एवं इवेंट लॉग",
        btnClearLog: "लॉग साफ़ करें",
        footerText: "ब्रिक्स सतत अवसंरचना एवं स्वच्छ वायु पहल • ओपन-एक्सेस पर्यावरण API, AI विज़न और नागरिक सेंसर द्वारा संचालित"
    },
    pt: {
        headerTitle: "Inteligência Climática BRICS+",
        headerBadge: "REDE FEDERADA IA",
        headerSubtitle: "Detecção Hiperlocal de Hotspots • Previsão de Picos Transfronteiriços • Model Mesh",
        navBrief: "Resumo Ministerial",
        tabLabel0: "1. Observação e Mapa",
        tabLabel1: "2. Visão IA e Hotspots",
        tabLabel2: "3. Previsão de Picos",
        tabLabel3: "4. Ranking e Saúde",
        tabLabel4: "5. Model Mesh e Gestão",
        corridorsTitle: "Corredores Membros BRICS+",
        filterAll: "Todos",
        filterAsia: "Ásia",
        filterAmericas: "Américas",
        filterEurasia: "Eurásia",
        filterAfrica: "África",
        filterMena: "MENA",
        aiVisionTitle: "Ingestão de Fotos e Fumaça por IA",
        aiVisionDesc: "Envie ou utilize fotos para detectar queima de biomassa agrícola, emissões industriais e nevoeiro urbano.",
        scenarioLabel: "Selecione o Cenário ou Envie uma Foto",
        scenario1: "🔥 Cenário 1: Queimada de Restolho Agrícola",
        scenario2: "🏭 Cenário 2: Emissão Industrial não Regulamentada",
        scenario3: "🚗 Cenário 3: Inversão Térmica de Fumaça Diesel",
        scenario4: "🌲 Cenário 4: Queimada Florestal e Biomassa",
        btnUploadCustom: "Carregar Foto",
        btnRunScan: "Executar Varredura IA",
        lblResultSource: "Fonte Detectada:",
        lblResultOpacity: "Opacidade Visual da Fumaça:",
        lblResultAqi: "AQI Estimado:",
        lblResultConf: "Confiança da IA:",
        healthTitle: "Impacto Socioeconômico e na Saúde",
        healthLabelEr: "Sobrecarga de Emergência Respiratória:",
        healthLabelPed: "Internações Pediátricas:",
        healthLabelLoss: "Perda de Produtividade:",
        healthLabelMort: "Mortalidade Evitável:",
        webhookTitle: "Despachante de Webhook de Emergência",
        webhookMinisterial: "Despacho de Limitação Ministerial",
        webhookDesc: "Acione protocolos automáticos de restrição de tráfego e emissões industriais de emergência.",
        btnDispatchStage3: "Despachar Webhook Estágio-3",
        satBannerTitle: "Constelação BRICS & Sincronização AOD Copernicus",
        satBannerDesc: "Telemetria contínua de profundidade óptica de aerossóis da constelação conjunta de satélites.",
        satLiveLabel: "AOD Satélite em Tempo Real",
        btnSyncSat: "Sincronizar",
        hotspotRadarTitle: "Radar de Hotspots e Anomalias Transfronteiriças",
        hotspotRadarDesc: "Identifica queimadas e emissões industriais ocultas unindo dados de cidadãos com sensoriamento remoto.",
        spikeForecastTitle: "Motor de Previsão de Picos de Qualidade do Ar",
        spikeForecastDesc: "Projeta acúmulo por inversão térmica e convergência de plumas para 6h, 12h e 24h.",
        leaderboardTitle: "Ranking em Tempo Real de Qualidade do Ar BRICS+",
        leaderboardDesc: "Índice comparativo ao vivo de todas as capitais e nós econômicos membros.",
        mapSectionTitle: "Rastreamento Geoespacial de Corredores e Plumas",
        lblHotspotToggleOn: "Radar de Hotspots: LIGADO",
        lblHotspotToggleOff: "Radar de Hotspots: DESLIGADO",
        lblAodToggle: "Camada AOD de Satélite",
        plumeDriftTitle: "Simulador de Deriva de Pluma Transfronteiriça",
        btnPlumeDriftEnable: "Ativar Deriva de 3 Horas",
        btnPlumeDriftDisable: "Desativar Deriva de 3 Horas",
        matrixTitle: "Matriz Multipoluente em Tempo Real",
        matrixSubtitle: "Clique em um vetor para inspecionar",
        lblActiveVector: "Vetor Ativo",
        lblLiveConc: "Concentração em Tempo Real",
        lblLastSync: "Última Sincronização",
        meshTitle: "Rede de Modelos de ML Federados BRICS",
        meshDesc: "Intercâmbio interoperável de pesos de aprendizado por transferência e ativos de mitigação.",
        btnSyncAllModels: "Sincronizar Todos os Modelos",
        resourcesTitle: "Ativos de Mitigação Compartilhados",
        policyAdvisorTitle: "Diretiva do Assessor de Políticas de IA",
        treatySimTitle: "Simulador de Redução de Emissões do Tratado BRICS",
        lblTreatyBaseline: "Linha de Base Atual (0%)",
        lblTreatyModerate: "Conformidade com Tratado (-25%)",
        lblTreatyAggressive: "Meta Net-Zero Agressiva (-50%)",
        chartTrendTitle: "Tendência e Projeção de 7 Dias (Open-Meteo)",
        chartSourceTitle: "Atribuição de Fontes",
        btnExportCsv: "CSV",
        btnExportJson: "JSON",
        terminalTitle: "Log de Eventos e Despachos Federados BRICS",
        btnClearLog: "Limpar Log",
        footerText: "Iniciativa de Infraestrutura Sustentável e Ar Limpo BRICS • Alimentada por APIs Ambientais Abertas e IA"
    },
    ru: {
        headerTitle: "Климатическая аналитика БРИКС+",
        headerBadge: "ИИ-СЕТЬ БРИКС",
        headerSubtitle: "Гиперлокальное обнаружение очагов • Трансграничный прогноз пиков • Федерация моделей",
        navBrief: "Министерский отчет",
        tabLabel0: "1. Мониторинг и карта",
        tabLabel1: "2. ИИ-зрение и очаги",
        tabLabel2: "3. Прогноз пиков и тренды",
        tabLabel3: "4. Рейтинг и здоровье",
        tabLabel4: "5. Сетка моделей и управление",
        corridorsTitle: "Экономические коридоры БРИКС+",
        filterAll: "Все",
        filterAsia: "Азия",
        filterAmericas: "Америка",
        filterEurasia: "Евразия",
        filterAfrica: "Африка",
        filterMena: "Ближний Восток",
        aiVisionTitle: "ИИ-анализ фотографий и дымовых шлейфов",
        aiVisionDesc: "Загружайте фотографии для выявления сжигания стерни, промышленных факелов и плотного смога.",
        scenarioLabel: "Выберите сценарий или загрузите фото",
        scenario1: "🔥 Сценарий 1: Сжигание сельскохозяйственной стерни",
        scenario2: "🏭 Сценарий 2: Неконтролируемый промышленный выброс",
        scenario3: "🚗 Сценарий 3: Автомобильный инверсионный смог",
        scenario4: "🌲 Сценарий 4: Лесной биомассный пожар",
        btnUploadCustom: "Загрузить фото",
        btnRunScan: "Запустить ИИ-сканирование",
        lblResultSource: "Обнаруженный источник:",
        lblResultOpacity: "Оптическая плотность дыма:",
        lblResultAqi: "Оценочный AQI:",
        lblResultConf: "Точность ИИ:",
        healthTitle: "Влияние на здоровье и экономику",
        healthLabelEr: "Нагрузка на респираторную скорую помощь:",
        healthLabelPed: "Педиатрическая госпитализация:",
        healthLabelLoss: "Потери производительности:",
        healthLabelMort: "Предотвратимая смертность:",
        webhookTitle: "Диспетчер аварийных вебхуков",
        webhookMinisterial: "Министерская диспетчеризация",
        webhookDesc: "Запуск протоколов автоматического ограничения дорожного движения и промышленных выбросов.",
        btnDispatchStage3: "Отправить Webhook Этапа 3",
        satBannerTitle: "Спутники БРИКС и синхронизация AOD Copernicus",
        satBannerDesc: "Непрерывная телеметрия оптической толщины аэрозолей от спутниковой группировки.",
        satLiveLabel: "Спутниковый индекс AOD",
        btnSyncSat: "Синхронизировать",
        hotspotRadarTitle: "Радар скрытых очагов и трансграничных аномалий",
        hotspotRadarDesc: "Объединение фотоснимков жителей и тепловых спутниковых данных для поиска ночных выбросов.",
        spikeForecastTitle: "ИИ-движок прогнозирования пиков загрязнения",
        spikeForecastDesc: "Прогноз температурной инверсии и переноса шлейфов на горизонты 6ч, 12ч и 24ч.",
        leaderboardTitle: "Рейтинг качества воздуха стран БРИКС+",
        leaderboardDesc: "Сравнительный индекс в реальном времени по всем столицам и экономическим узлам.",
        mapSectionTitle: "Геопространственный мониторинг коридоров и шлейфов",
        lblHotspotToggleOn: "Радар очагов: ВКЛ",
        lblHotspotToggleOff: "Радар очагов: ВЫКЛ",
        lblAodToggle: "Спутниковый слой AOD",
        plumeDriftTitle: "Симулятор трансграничного дрейфа шлейфа",
        btnPlumeDriftEnable: "Включить 3-часовой дрейф",
        btnPlumeDriftDisable: "Отключить 3-часовой дрейф",
        matrixTitle: "Матрица загрязнителей в реальном времени",
        matrixSubtitle: "Нажмите на вектор для анализа",
        lblActiveVector: "Активный вектор",
        lblLiveConc: "Текущая концентрация",
        lblLastSync: "Последняя синхронизация",
        meshTitle: "Федеративная сеть моделей машинного обучения БРИКС",
        meshDesc: "Межгосударственный обмен весами моделей трансферного обучения и ресурсами ликвидации смога.",
        btnSyncAllModels: "Синхронизировать все модели",
        resourcesTitle: "Общие средства оперативной ликвидации",
        policyAdvisorTitle: "Директива ИИ-советника по политике",
        treatySimTitle: "Симулятор сокращения выбросов по договору БРИКС",
        lblTreatyBaseline: "Текущий базовый уровень (0%)",
        lblTreatyModerate: "Выполнение договора (-25%)",
        lblTreatyAggressive: "Амбициозная цель Net-Zero (-50%)",
        chartTrendTitle: "7-дневный тренд и прогноз (Open-Meteo)",
        chartSourceTitle: "Атрибуция источников",
        btnExportCsv: "CSV",
        btnExportJson: "JSON",
        terminalTitle: "Журнал многонациональных диспетчерских событий БРИКС",
        btnClearLog: "Очистить журнал",
        footerText: "Инициатива БРИКС по устойчивой инфраструктуре и чистому воздуху • Открытые API и ИИ-аналитика"
    },
    ar: {
        headerTitle: "منصة بريكس+ للاستخبارات المناخية",
        headerBadge: "شبكة الذكاء الاصطناعي",
        headerSubtitle: "الكشف عن البؤر شديدة المحلية • التنبؤ بارتفاع التلوث عبر الحدود • شبكة النماذج",
        navBrief: "التقرير الوزاري",
        tabLabel0: "1. الرصد والخرائط",
        tabLabel1: "2. الرؤية الذكية والبؤر",
        tabLabel2: "3. تنبؤ الذروة والاتجاهات",
        tabLabel3: "4. لوحة التصنيف والتأثير الصحي",
        tabLabel4: "5. شبكة النماذج والحوكمة",
        corridorsTitle: "الممرات الاقتصادية لدول بريكس+",
        filterAll: "الكل",
        filterAsia: "آسيا",
        filterAmericas: "الأمريكتان",
        filterEurasia: "أوراسيا",
        filterAfrica: "أفريقيا",
        filterMena: "الشرق الأوسط وشمال أفريقيا",
        aiVisionTitle: "تحليل صور الدخان بالذكاء الاصطناعي",
        aiVisionDesc: "قم برفع أو مسح صور المواطنين للكشف عن حرق المخلفات الزراعية والانبعاثات الصناعية والضباب الدخاني.",
        scenarioLabel: "اختر السيناريو أو ارفع صورة",
        scenario1: "🔥 سيناريو 1: حرق القش والمخلفات الزراعية",
        scenario2: "🏭 سيناريو 2: انبعاثات المداخن الصناعية غير المنظمة",
        scenario3: "🚗 سيناريو 3: انقلاب حراري لدخان الديزل على الطرق",
        scenario4: "🌲 سيناريو 4: حرائق الغابات والكتلة الحيوية",
        btnUploadCustom: "رفع صورة مخصصة",
        btnRunScan: "تشغيل المسح الذكي",
        lblResultSource: "المصدر المكتشف:",
        lblResultOpacity: "عتامة الدخان البصرية:",
        lblResultAqi: "مؤشر جودة الهواء التقديري:",
        lblResultConf: "نسبة ثقة الذكاء الاصطناعي:",
        healthTitle: "التأثير الصحي والاجتماعي الاقتصادي",
        healthLabelEr: "ضغط طوارئ الجهاز التنفسي:",
        healthLabelPed: "حالات دخول الأطفال للمستشفى:",
        healthLabelLoss: "الخسائر في الإنتاجية:",
        healthLabelMort: "أعباء الوفيات التي يمكن تفاديها:",
        webhookTitle: "موجّه خطاف الطوارئ الوزاري",
        webhookMinisterial: "توجيهات الحد من الانبعاثات",
        webhookDesc: "تفعيل بروتوكولات تقييد حركة المرور والانبعاثات الصناعية تلقائياً في البلديات الأعضاء.",
        btnDispatchStage3: "إرسال إنذار الطوارئ (المرحلة 3)",
        satBannerTitle: "كوكبة أقمار بريكس وتزامن كوبرنيكوس AOD",
        satBannerDesc: "بث متواصل للعمق البصري للهباء الجوي من الأقمار الصناعية المشتركة.",
        satLiveLabel: "مؤشر AOD الفضائي الحي",
        btnSyncSat: "مزامنة",
        hotspotRadarTitle: "رادار البؤر المخفية والانبعاثات العابرة للحدود",
        hotspotRadarDesc: "دمج صور المواطنين الميدانية مع الشذوذ الحراري للأقمار لاكتشاف الانبعاثات الليلية وحرق القش.",
        spikeForecastTitle: "محرك التنبؤ بذروة جودة الهواء",
        spikeForecastDesc: "توقع الانقلاب الحراري والرياح العابرة للحدود عبر آفاق 6 و12 و24 ساعة.",
        leaderboardTitle: "لوحة تصنيف جودة الهواء الحية لدول بريكس+",
        leaderboardDesc: "مؤشر مقارن مباشر لجميع العواصم والمراكز الاقتصادية الأعضاء.",
        mapSectionTitle: "تتبع الممرات وسحب الدخان الجغرافية",
        lblHotspotToggleOn: "رادار البؤر: مفعّل",
        lblHotspotToggleOff: "رادار البؤر: معطّل",
        lblAodToggle: "طبقة AOD الفضائية",
        plumeDriftTitle: "محاكي انجراف الدخان عبر الحدود",
        btnPlumeDriftEnable: "تفعيل محاكاة 3 ساعات",
        btnPlumeDriftDisable: "إيقاف محاكاة 3 ساعات",
        matrixTitle: "مصفوفة الغازات والملوثات الحية",
        matrixSubtitle: "انقر فوق الملوث للفحص",
        lblActiveVector: "الملوث النشط",
        lblLiveConc: "التركيز الحي",
        lblLastSync: "آخر مزامنة",
        meshTitle: "شبكة نماذج التعلم الآلي الفيدرالية لبريكس",
        meshDesc: "التبادل المتبادل لأوزان نماذج التعلم ومعدات التخفيف من التلوث عبر دول بريكس.",
        btnSyncAllModels: "مزامنة جميع أوزان النماذج",
        resourcesTitle: "أصول الطوارئ المشتركة للحد من التلوث",
        policyAdvisorTitle: "توجيهات مستشار السياسات الذكي",
        treatySimTitle: "محاكي خفض الانبعاثات وفق معاهدة بريكس",
        lblTreatyBaseline: "خط الأساس الحالي (0%)",
        lblTreatyModerate: "الامتثال للمعاهدة (-25%)",
        lblTreatyAggressive: "هدف الصفر الصافي الطموح (-50%)",
        chartTrendTitle: "اتجاه وتوقعات 7 أيام (Open-Meteo)",
        chartSourceTitle: "نسب مصادر التلوث",
        btnExportCsv: "CSV",
        btnExportJson: "JSON",
        terminalTitle: "سجل أحداث والتوجيهات الفيدرالية المشتركة",
        btnClearLog: "مسح السجل",
        footerText: "مبادرة البنية التحتية المستدامة والهواء النظيف لدول بريكس • مدعومة بالبيانات المفتوحة والذكاء الاصطناعي"
    }
};

// --- Dashboard initialization ---
function startDashboard() {
    if (dashboardStarted) return;
    dashboardStarted = true;
    initWebSocket();
    initMap();
    initCharts();
    renderCountrySelector();
    renderCorridorsList('all');
    renderLeaderboard();
    updateHealthImpact(242);
    setupEventListeners();
    selectCorridor('Delhi');
    fetchGlobalOverview();
    fetchGlobalFeed();
    startRealTimeSatelliteStream();
    fetchFederatedModels();
    fetchSharedResources();
    switchSlideWindow(0);
    setInterval(updateLiveClock, 1000);
}

document.addEventListener('DOMContentLoaded', () => {
    const introScreen = document.getElementById('intro-screen');
    const enterButton = document.getElementById('enter-dashboard');

    enterButton?.addEventListener('click', () => {
        introScreen?.classList.add('intro-screen-exit');
        window.setTimeout(() => introScreen?.remove(), 650);
        startDashboard();
    });
});

// --- Sliding Window Navigation System ---
function switchSlideWindow(index) {
    currentWindowIndex = Math.max(0, Math.min(totalWindows - 1, index));
    document.body.classList.toggle('observation-overview-active', currentWindowIndex === 0);

    // Update pane visibility and tab active state
    for (let i = 0; i < totalWindows; i++) {
        const pane = document.getElementById(`slide-window-${i}`);
        const tabBtn = document.getElementById(`tab-window-${i}`);

        if (pane) {
            if (i === currentWindowIndex) pane.classList.add('active');
            else pane.classList.remove('active');
        }

        if (tabBtn) {
            // Reset base styles, toggle active-tab class
            tabBtn.classList.remove('active-tab', 'bg-white', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-300');
            if (i === currentWindowIndex) {
                tabBtn.classList.add('active-tab');
            } else {
                tabBtn.classList.add('bg-white', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-300');
            }
        }
    }

    const counter = document.getElementById('window-counter');
    if (counter) counter.innerText = `${currentWindowIndex + 1} / ${totalWindows}`;

    // Leaflet must invalidate when map pane becomes visible
    if (currentWindowIndex === 0 && map) {
        setTimeout(() => map.invalidateSize(), 150);
        setTimeout(() => map.invalidateSize(), 450);
    }
}

function slideWindowNav(direction) {
    let nextIndex = currentWindowIndex + direction;
    if (nextIndex < 0) nextIndex = totalWindows - 1;
    if (nextIndex >= totalWindows) nextIndex = 0;
    switchSlideWindow(nextIndex);
}

// --- Leaflet Map Setup with Guaranteed Visibility & Invalidation ---
function initMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    map = L.map('map', {
        zoomControl: true,
        scrollWheelZoom: true
    }).setView([28.6139, 77.2090], 9);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; OpenStreetMap contributors &bull; BRICS Earth Observation'
    }).addTo(map);

    allCorridorMarkersGroup = L.layerGroup().addTo(map);
    aodLayerGroup = L.layerGroup().addTo(map);
    plumeDriftGroup = L.layerGroup().addTo(map);
    citizenMarkersGroup = L.layerGroup().addTo(map);
    hotspotMarkersGroup = L.layerGroup().addTo(map);

    renderAllCorridorsOnMap();

    setTimeout(() => { if (map) map.invalidateSize(); }, 150);
    setTimeout(() => { if (map) map.invalidateSize(); }, 600);
    window.addEventListener('resize', () => { if (map) map.invalidateSize(); });
}

function renderAllCorridorsOnMap() {
    if (!allCorridorMarkersGroup) return;
    allCorridorMarkersGroup.clearLayers();

    Object.values(corridorsData).forEach(corridor => {
        const marker = L.circleMarker([corridor.lat, corridor.lon], {
            radius: 8,
            color: '#4f46e5',
            fillColor: '#6366f1',
            fillOpacity: 0.8,
            weight: 2
        }).bindPopup(`
            <div class="text-xs font-sans">
                <b>${corridor.flag} ${corridor.name}</b><br>
                <span class="text-slate-500">${corridor.country} &bull; ${corridor.region}</span><br>
                <button onclick="selectCorridor('${corridor.id}')" style="margin-top:6px; background:#4f46e5; color:white; padding:3px 8px; border-radius:6px; font-weight:bold; cursor:pointer;">Focus Corridor</button>
            </div>
        `);
        marker.addTo(allCorridorMarkersGroup);
    });
}

function renderInitialCitizenMarkers(reports) {
    if (!citizenMarkersGroup) return;
    citizenMarkersGroup.clearLayers();
    reports.forEach(r => addCitizenMarker(r));
}

function addCitizenMarker(report) {
    if (!map || !citizenMarkersGroup) return;

    let markerColor = '#10b981';
    if (report.aqi > 300) markerColor = '#881337';
    else if (report.aqi > 200) markerColor = '#9333ea';
    else if (report.aqi > 150) markerColor = '#ef4444';
    else if (report.aqi > 100) markerColor = '#f97316';
    else if (report.aqi > 50) markerColor = '#eab308';

    const citizenMarker = L.circleMarker([report.lat, report.lon], {
        radius: 9,
        color: '#ffffff',
        fillColor: markerColor,
        fillOpacity: 0.9,
        weight: 2
    }).bindPopup(`
        <div class="text-xs font-sans">
            <b><i class="fa-solid fa-tower-broadcast text-teal-600"></i> Citizen Sensor Node</b><br>
            <b>${report.location}</b><br>
            Reported AQI: <b style="color:${markerColor}">${report.aqi}</b><br>
            <span class="text-slate-400">Timestamp: ${report.timestamp || 'Live'}</span>
        </div>
    `);

    citizenMarker.addTo(citizenMarkersGroup);
}

// --- WebSocket Connection & Real-Time Handlers ---
function initWebSocket() {
    try {
        const socketOptions = {
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 2000
        };

        socket = io(API_BASE_URL || undefined, socketOptions);

        socket.on('connect', () => {
            console.log(`[Socket.io] Connected to BRICS Backend Hub.`);
            appendLog(`[Backend Sync] WebSocket connected to real-time grid gateway.`);
        });

        socket.on('disconnect', () => {
            console.warn('[Socket.io] Disconnected from backend gateway.');
            appendLog(`[Backend Sync] WebSocket connection dropped. Reconnecting...`);
        });

        socket.on('init-state', (data) => {
            if (data.hotspots) {
                currentHotspots = data.hotspots;
                renderHotspotsRadar(currentHotspots);
                renderHotspotMarkersOnMap(currentHotspots);
            }
            if (data.federatedModels) {
                currentFederatedModels = data.federatedModels;
                renderFederatedModels(currentFederatedModels);
            }
            if (data.sharedResources) {
                currentSharedResources = data.sharedResources;
                renderSharedResources(currentSharedResources);
            }
            if (data.gridState && data.gridState.citizenReports) {
                renderInitialCitizenMarkers(data.gridState.citizenReports);
            }
            if (data.gridState && data.gridState.logs) {
                data.gridState.logs.forEach(l => appendLog(l));
            }
        });

        socket.on('new-hotspot-detected', (hotspot) => {
            currentHotspots.unshift(hotspot);
            renderHotspotsRadar(currentHotspots);
            renderHotspotMarkersOnMap(currentHotspots);
            appendLog(`[Hotspot Alert] ${hotspot.categoryName} detected at ${hotspot.location || 'Corridor'}.`);
        });

        socket.on('new-citizen-report', (report) => {
            addCitizenMarker(report);
            appendLog(`[Broadcast Ingested] ${report.location}: AQI ${report.aqi} verified by peer consensus.`);
        });

        socket.on('model-synced', (data) => {
            appendLog(data.message);
            fetchFederatedModels();
        });

        socket.on('rapid-alert-dispatched', (alertData) => {
            appendLog(`[RAPID INTERVENTION] Alert ${alertData.alertId} dispatched for ${alertData.targetHotspot}.`);
        });

        socket.on('webhook-triggered', (alertData) => {
            triggerEmergencyUI(alertData);
        });

    } catch (err) {
        console.error('Socket.io initialization error:', err);
    }
}

// --- Total Page Multi-Language Translation Engine ---
function applyLanguage(langCode) {
    currentLanguage = langCode;
    const t = i18nDictionary[langCode] || i18nDictionary.en;

    if (langCode === 'ar') {
        document.documentElement.setAttribute('dir', 'rtl');
    } else {
        document.documentElement.setAttribute('dir', 'ltr');
    }

    const elementMappings = {
        'header-title': t.headerTitle,
        'header-badge': t.headerBadge,
        'header-subtitle': t.headerSubtitle,
        'nav-brief-text': t.navBrief,
        'tab-label-0': t.tabLabel0,
        'tab-label-1': t.tabLabel1,
        'tab-label-2': t.tabLabel2,
        'tab-label-3': t.tabLabel3,
        'tab-label-4': t.tabLabel4,
        'corridors-title': t.corridorsTitle,
        'filter-all': t.filterAll,
        'filter-asia': t.filterAsia,
        'filter-americas': t.filterAmericas,
        'filter-eurasia': t.filterEurasia,
        'filter-africa': t.filterAfrica,
        'filter-mena': t.filterMena,
        'ai-vision-title': t.aiVisionTitle,
        'ai-vision-desc': t.aiVisionDesc,
        'scenario-label': t.scenarioLabel,
        'btn-upload-custom': t.btnUploadCustom,
        'btn-run-scan': t.btnRunScan,
        'lbl-result-source': t.lblResultSource,
        'lbl-result-opacity': t.lblResultOpacity,
        'lbl-result-aqi': t.lblResultAqi,
        'lbl-result-conf': t.lblResultConf,
        'health-title': t.healthTitle,
        'health-label-er': t.healthLabelEr,
        'health-label-ped': t.healthLabelPed,
        'health-label-loss': t.healthLabelLoss,
        'health-label-mort': t.healthLabelMort,
        'webhook-title': t.webhookTitle,
        'webhook-ministerial': t.webhookMinisterial,
        'webhook-desc': t.webhookDesc,
        'btn-dispatch-stage3': t.btnDispatchStage3,
        'sat-banner-title': t.satBannerTitle,
        'sat-banner-desc': t.satBannerDesc,
        'sat-live-label': t.satLiveLabel,
        'btn-sync-sat': t.btnSyncSat,
        'hotspot-radar-title': t.hotspotRadarTitle,
        'hotspot-radar-desc': t.hotspotRadarDesc,
        'spike-forecast-title': t.spikeForecastTitle,
        'spike-forecast-desc': t.spikeForecastDesc,
        'leaderboard-title': t.leaderboardTitle,
        'leaderboard-desc': t.leaderboardDesc,
        'map-section-title': t.mapSectionTitle,
        'lbl-hotspot-toggle': isHotspotActive ? t.lblHotspotToggleOn : t.lblHotspotToggleOff,
        'lbl-aod-toggle': t.lblAodToggle,
        'plume-drift-title': t.plumeDriftTitle,
        'btn-plume-drift': isPlumeDriftActive ? t.btnPlumeDriftDisable : t.btnPlumeDriftEnable,
        'matrix-title': t.matrixTitle,
        'matrix-subtitle': t.matrixSubtitle,
        'lbl-active-vector': t.lblActiveVector,
        'lbl-live-conc': t.lblLiveConc,
        'lbl-last-sync': t.lblLastSync,
        'mesh-title': t.meshTitle,
        'mesh-desc': t.meshDesc,
        'btn-sync-all-models': t.btnSyncAllModels,
        'resources-title': t.resourcesTitle,
        'policy-advisor-title': t.policyAdvisorTitle,
        'treaty-sim-title': t.treatySimTitle,
        'lbl-treaty-baseline': t.lblTreatyBaseline,
        'lbl-treaty-moderate': t.lblTreatyModerate,
        'lbl-treaty-aggressive': t.lblTreatyAggressive,
        'chart-trend-title': t.chartTrendTitle,
        'chart-source-title': t.chartSourceTitle,
        'btn-export-csv': t.btnExportCsv,
        'btn-export-json': t.btnExportJson,
        'terminal-title': t.terminalTitle,
        'btn-clear-log': t.btnClearLog,
        'footer-text': t.footerText
    };

    Object.entries(elementMappings).forEach(([id, text]) => {
        const elem = document.getElementById(id);
        if (elem && text) {
            const icon = elem.querySelector('i');
            if (icon) {
                elem.innerHTML = `${icon.outerHTML} ${text}`;
            } else {
                elem.innerText = text;
            }
        }
    });

    const selectElem = document.getElementById('sample-photo-select');
    if (selectElem && selectElem.options.length >= 4) {
        selectElem.options[0].text = t.scenario1;
        selectElem.options[1].text = t.scenario2;
        selectElem.options[2].text = t.scenario3;
        selectElem.options[3].text = t.scenario4;
    }

    renderHotspotsRadar(currentHotspots);
    fetchFederatedModels();
    renderLeaderboard();
    if (map) setTimeout(() => map.invalidateSize(), 200);

    appendLog(`[Localization] Complete page language switched to [${langCode.toUpperCase()}].`);
}

// --- Corridors List & Filtering ---
function renderCorridorsList(filter = 'all') {
    const listContainer = document.getElementById('corridors-list');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    Object.values(corridorsData).forEach(corridor => {
        if (filter !== 'all' && corridor.regionGroup !== filter) return;

        const isSelected = corridor.id === currentCorridorKey;
        const btn = document.createElement('button');
        btn.onclick = () => selectCorridor(corridor.id);
        btn.className = `w-full text-left p-2.5 rounded-2xl transition border flex justify-between items-center group shadow-sm cursor-pointer ${
            isSelected
                ? 'bg-gradient-to-r from-cyan-100 to-indigo-100 dark:from-slate-800 dark:to-indigo-950/80 border-cyan-400 dark:border-indigo-500 ring-2 ring-indigo-500/20'
                : 'bg-white dark:bg-slate-800/80 hover:bg-cyan-50/70 dark:hover:bg-slate-700/80 border-cyan-100 dark:border-slate-700/80'
        }`;

        btn.innerHTML = `
            <div class="flex items-center space-x-2.5">
                <span class="text-lg">${corridor.flag}</span>
                <div>
                    <p class="font-bold text-xs text-slate-800 dark:text-slate-100 group-hover:text-cyan-900 dark:group-hover:text-cyan-300">${corridor.name}</p>
                    <p class="text-[10px] text-slate-500 dark:text-slate-400">${corridor.country} &bull; ${corridor.region}</p>
                </div>
            </div>
            <i class="fa-solid fa-chevron-right text-xs text-cyan-500 group-hover:translate-x-1 transition-transform"></i>
        `;

        listContainer.appendChild(btn);
    });
}

function filterCorridors(group) {
    document.querySelectorAll('.corridor-filter').forEach(btn => {
        btn.classList.remove('bg-indigo-600', 'text-white');
        btn.classList.add('bg-slate-100', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-300');
    });

    const activeBtn = document.getElementById(`filter-${group.toLowerCase()}`);
    if (activeBtn) {
        activeBtn.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-300');
        activeBtn.classList.add('bg-indigo-600', 'text-white');
    }

    renderCorridorsList(group);
}

// --- Real-Time BRICS Air Quality Leaderboard ---
function getCountryOptions() {
    const map = new Map();

    Object.values(corridorsData).forEach(corridor => {
        if (!map.has(corridor.countryCode)) {
            map.set(corridor.countryCode, {
                countryCode: corridor.countryCode,
                country: corridor.country,
                flag: corridor.flag,
                corridorKey: corridor.id
            });
        }
    });

    return Array.from(map.values()).sort((a, b) => a.country.localeCompare(b.country));
}

function renderCountrySelector() {
    const selector = document.getElementById('country-select');
    if (!selector) return;

    const options = getCountryOptions();
    selector.innerHTML = options.map(option => `
        <option value="${option.countryCode}">${option.flag} ${option.country}</option>
    `).join('');

    selector.value = selectedCountryCode;
    selector.onchange = () => selectCountry(selector.value);
}

function selectCountry(countryCode) {
    const matched = getCountryOptions().find(option => option.countryCode === countryCode);
    if (!matched) return;

    selectedCountryCode = countryCode;
    selectedCountryName = matched.country;
    renderCountrySelector();
    selectCorridor(matched.corridorKey || currentCorridorKey);
}

function renderLeaderboard() {
    const tbody = document.getElementById('leaderboard-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    const sorted = Object.values(corridorsData).sort((a, b) => (b.baseAqi || 100) - (a.baseAqi || 100));

    sorted.forEach((c, idx) => {
        const row = document.createElement('tr');
        row.className = `hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer ${c.id === currentCorridorKey ? 'bg-indigo-50/70 dark:bg-indigo-950/40 font-bold' : ''}`;
        row.onclick = () => selectCorridor(c.id);

        let badgeClass = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
        let statusText = "Good";
        if (c.baseAqi > 200) {
            badgeClass = "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 animate-pulse";
            statusText = "Hazardous / High Alert";
        } else if (c.baseAqi > 150) {
            badgeClass = "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300";
            statusText = "Unhealthy";
        } else if (c.baseAqi > 100) {
            badgeClass = "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
            statusText = "Moderate Inversion";
        }

        row.innerHTML = `
            <td class="py-2.5 font-bold text-slate-400">#${idx + 1}</td>
            <td class="py-2.5 font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-1.5">
                <span>${c.flag}</span>
                <span>${c.name.replace(' Corridor', '').replace(' National Capital Region', ' NCR')}</span>
            </td>
            <td class="py-2.5 text-slate-500 dark:text-slate-400">${c.country}</td>
            <td class="py-2.5 font-mono font-black ${c.baseAqi > 150 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}">${c.baseAqi}</td>
            <td class="py-2.5 text-slate-600 dark:text-slate-300 text-[11px]">${c.dominantPollutant}</td>
            <td class="py-2.5">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold ${badgeClass}">${statusText}</span>
            </td>
            <td class="py-2.5 text-right">
                <button onclick="selectCorridor('${c.id}'); switchSlideWindow(0);" class="px-2.5 py-1 text-[10px] font-bold bg-indigo-50 dark:bg-slate-700 hover:bg-indigo-600 hover:text-white text-indigo-700 dark:text-indigo-300 rounded-lg transition">Focus</button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

// --- Select Corridor & Fetch Real-World Telemetry ---
async function selectCorridor(corridorKey) {
    const corridor = corridorsData[corridorKey];
    if (!corridor) return;

    currentCorridorKey = corridorKey;
    selectedCountryCode = corridor.countryCode;
    selectedCountryName = corridor.country;
    renderCountrySelector();
    renderCorridorsList();
    renderLeaderboard();

    document.getElementById('selected-flag').innerText = corridor.flag;
    document.getElementById('selected-country').innerText = `${corridor.country} • ${corridor.region}`;
    document.getElementById('selected-city').innerText = corridor.name;

    updateHealthImpact(corridor.baseAqi || 150);

    if (map) {
        map.flyTo([corridor.lat, corridor.lon], 10, { duration: 1.2 });
        setTimeout(() => map.invalidateSize(), 300);
    }

    appendLog(`[Corridor Focus] Switched focal vector to ${corridor.name} (${corridor.flag} ${corridor.country}).`);

    await Promise.all([
        fetchRealWorldTelemetry(corridor),
        fetchHotspots(corridor.id),
        fetchSpikeForecast(corridor.id)
    ]);

    fetchGlobalOverview();
    updateSourceChart(corridor);
}

// --- Fetch Real-World Data (Air Quality, Weather, World Bank) ---
async function fetchGlobalOverview() {
    try {
        const res = await fetch(apiUrl('/api/global-overview'));
        const data = await res.json();
        if (data.status !== 'success') return;

        const list = document.getElementById('global-pulse-list');
        const totalBadge = document.getElementById('global-aqi-total');
        if (!list) return;

        const pulse = data.worldPulse || [];
        if (totalBadge) totalBadge.innerText = `${data.totalCountries} countries`;

        list.innerHTML = pulse.map((entry, index) => {
            const riskClass = entry.aqi > 180 ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' : entry.aqi > 100 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
            return `
                <div class="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/50 px-2.5 py-2">
                    <div class="flex items-center gap-2">
                        <span class="text-xs font-black text-slate-500 dark:text-slate-400">#${index + 1}</span>
                        <span class="text-sm">${entry.flag}</span>
                        <div>
                            <p class="text-[11px] font-black text-slate-800 dark:text-slate-100">${entry.country}</p>
                            <p class="text-[10px] text-slate-500 dark:text-slate-400">${entry.region}</p>
                        </div>
                    </div>
                    <span class="px-2 py-0.5 rounded-lg text-[10px] font-black ${riskClass}">${entry.aqi} AQI</span>
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error('Global pulse fetch failed:', err);
    }
}

function updateLiveClock() {
    const el = document.getElementById('live-clock');
    if (!el) return;
    el.innerText = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

async function fetchGlobalFeed() {
    try {
        const res = await fetch(apiUrl('/api/global-feed'));
        const data = await res.json();
        if (data.status !== 'success') return;

        const feedList = document.getElementById('global-feed-list');
        if (feedList) {
            feedList.innerHTML = (data.alerts || []).slice(0, 4).map(item => {
                const badgeClass = item.severity === 'Critical' ? 'bg-rose-600 text-white' : item.severity === 'High' ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500 text-white';
                const timeLabel = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return `
                    <div class="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/70 p-2.5">
                        <div class="flex items-center justify-between gap-2 mb-1">
                            <div class="flex items-center gap-2">
                                <span class="text-[10px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">${item.region}</span>
                                <span class="px-1.5 py-0.5 rounded text-[9px] font-black ${badgeClass}">${item.severity}</span>
                            </div>
                            <span class="text-[9px] text-slate-500 dark:text-slate-400">${timeLabel}</span>
                        </div>
                        <p class="text-[11px] font-bold text-slate-800 dark:text-slate-100 leading-snug">${item.title}</p>
                        <p class="mt-1 text-[10px] text-slate-600 dark:text-slate-300">${item.impact}</p>
                    </div>
                `;
            }).join('');
        }

        const summary = data.summary || {};
        const value = document.getElementById('network-health-value');
        const bar = document.getElementById('network-health-bar');
        const alerts = document.getElementById('global-alert-count');
        const sensors = document.getElementById('global-sensor-count');
        const risk = document.getElementById('global-risk-index');
        const policies = document.getElementById('global-policy-count');

        if (value && bar) {
            const health = Number(summary.networkHealth || 93);
            value.innerText = `${health}%`;
            bar.style.width = `${health}%`;
        }
        if (alerts) alerts.innerText = Number(summary.activeAlerts || 0);
        if (sensors) sensors.innerText = Number(summary.liveSensors || 0).toLocaleString();
        if (risk) risk.innerText = Number(summary.climateRiskIndex || 0);
        if (policies) policies.innerText = Number(summary.policyActions || 0);
    } catch (err) {
        console.error('Global climate feed fetch failed:', err);
    }
}

async function fetchRealWorldTelemetry(corridor) {
    const aqiBadge = document.getElementById('aqi-badge');
    const weatherText = document.getElementById('weather-text');

    if (weatherText) weatherText.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-amber-500 mr-2"></i> Synching live Open-Meteo & Copernicus data for ${corridor.name}...`;

    try {
        const [aqRes, wxRes, wbRes] = await Promise.allSettled([
            fetch(apiUrl(`/api/air-quality?lat=${corridor.lat}&lon=${corridor.lon}&city=${encodeURIComponent(corridor.id)}`)).then(r => r.json()),
            fetch(apiUrl(`/api/weather?lat=${corridor.lat}&lon=${corridor.lon}`)).then(r => r.json()),
            fetch(apiUrl(`/api/brics-indicators/${corridor.countryCode}`)).then(r => r.json())
        ]);

        if (aqRes.status === 'fulfilled' && aqRes.value.status === 'success') {
            currentAirQuality = aqRes.value.data;
            updateAirQualityUI(currentAirQuality, corridor);
        } else {
            updateHealthImpact(corridor.baseAqi || 150);
        }

        if (wxRes.status === 'fulfilled' && wxRes.value.status === 'success') {
            currentWeather = wxRes.value.data;
            updateWeatherUI(currentWeather, corridor);
        }

        if (wbRes.status === 'fulfilled' && wbRes.value.status === 'success') {
            currentWorldBank = wbRes.value.data;
        }

        updateMapLayers(corridor, currentAirQuality, currentWeather);
        generateAIPolicyDirective(corridor, currentAirQuality, currentWeather);

    } catch (err) {
        console.error('Error fetching real-world telemetry:', err);
        updateHealthImpact(corridor.baseAqi || 150);
    }
}

function updateAirQualityUI(aq, corridor) {
    const aqi = aq.usAqi || corridor.baseAqi || 150;
    const aqiBadge = document.getElementById('aqi-badge');
    
    if (aqiBadge) {
        let badgeColor = "bg-emerald-600 text-white";
        let statusLabel = "Good";

        if (aqi > 300) {
            badgeColor = "bg-rose-900 text-white animate-pulse";
            statusLabel = "Hazardous (Stage-3 Lockdown)";
        } else if (aqi > 200) {
            badgeColor = "bg-purple-600 text-white";
            statusLabel = "Very Unhealthy";
        } else if (aqi > 150) {
            badgeColor = "bg-rose-600 text-white";
            statusLabel = "Unhealthy";
        } else if (aqi > 100) {
            badgeColor = "bg-orange-500 text-white";
            statusLabel = "Unhealthy for Sensitive Groups";
        } else if (aqi > 50) {
            badgeColor = "bg-amber-500 text-slate-900";
            statusLabel = "Moderate";
        }

        aqiBadge.className = `px-4 py-1.5 rounded-2xl text-xs font-black shadow-md ${badgeColor}`;
        aqiBadge.innerText = `AQI Index: ${aqi} (${statusLabel})`;
    }

    switchPollutantVector(activePollutantVector);
    updateHealthImpact(aqi);

    if (trendChartInstance && aq.trend) {
        trendChartInstance.data.labels = aq.trend.labels;
        trendChartInstance.data.datasets[0].data = aq.trend.data;
        trendChartInstance.update();
    }
}

function updateWeatherUI(wx, corridor) {
    const weatherText = document.getElementById('weather-text');
    const windVectorText = document.getElementById('wind-vector-text');

    const temp = wx.temperature ?? 25;
    const hum = wx.humidity ?? 50;
    const windSpd = wx.windSpeed ?? 10;
    const windDir = wx.windDirection ?? 240;
    const press = wx.pressure ?? 1013;

    const compassDirections = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const compass = compassDirections[Math.round(windDir / 22.5) % 16];

    if (weatherText) {
        weatherText.innerHTML = `<i class="fa-solid fa-cloud-sun text-amber-500 mr-1.5"></i> Weather: <b>${temp}°C</b> &bull; Humidity: <b>${hum}%</b> &bull; Wind: <b>${windSpd} km/h (${compass})</b>`;
    }

    if (windVectorText) {
        windVectorText.innerHTML = `Live Wind Vector: <span class="font-bold text-slate-700 dark:text-slate-200">${windSpd} km/h at ${windDir}° (${compass})</span> &bull; 3-hour trajectory projection.`;
    }

    appendLog(`[Open-Meteo Sync] Received atmospheric vector for ${corridor.name}: ${temp}°C, Wind ${windSpd} km/h (${compass}).`);
}

function switchPollutantVector(vector) {
    activePollutantVector = vector;

    const mapping = {
        'PM2.5': { val: currentAirQuality.pm25 ?? 54.6, unit: 'µg/m³', desc: 'Fine Particulate Matter', color: 'text-rose-600 dark:text-rose-400' },
        'PM10': { val: currentAirQuality.pm10 ?? 110.2, unit: 'µg/m³', desc: 'Coarse Dust Vector', color: 'text-orange-600 dark:text-orange-400' },
        'NO₂': { val: currentAirQuality.no2 ?? 42.1, unit: 'µg/m³', desc: 'Nitrogen Dioxide Flux', color: 'text-indigo-600 dark:text-indigo-400' },
        'SO₂': { val: currentAirQuality.so2 ?? 18.5, unit: 'µg/m³', desc: 'Sulfur Dioxide Emissions', color: 'text-blue-600 dark:text-blue-400' },
        'CO': { val: currentAirQuality.co ?? 0.85, unit: 'mg/m³', desc: 'Carbon Monoxide Trace', color: 'text-emerald-600 dark:text-emerald-400' },
        'O₃': { val: currentAirQuality.ozone ?? 32.0, unit: 'µg/m³', desc: 'Tropospheric Ozone Level', color: 'text-teal-600 dark:text-teal-400' },
        'Dust': { val: currentAirQuality.dust ?? 291.0, unit: 'µg/m³', desc: 'Mineral Dust Aerosols', color: 'text-amber-700 dark:text-amber-400' }
    };

    const target = mapping[vector] || mapping['PM2.5'];

    document.querySelectorAll('.pollutant-btn').forEach(btn => {
        const btnText = btn.innerText.trim();
        if (btnText === vector) {
            btn.className = "pollutant-btn px-3.5 py-2 text-xs font-bold rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-600 text-white shadow-sm cursor-pointer transition";
        } else {
            btn.className = "pollutant-btn px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-700 transition cursor-pointer";
        }
    });

    const nameElem = document.getElementById('pollutant-name');
    const valElem = document.getElementById('pollutant-value');
    const updatedElem = document.getElementById('last-updated');

    if (nameElem) nameElem.innerText = `${vector} (${target.desc})`;
    if (valElem) {
        valElem.innerText = `${target.val} ${target.unit}`;
        valElem.className = `text-xl font-black mt-1 pl-2 ${target.color}`;
    }
    if (updatedElem) updatedElem.innerText = new Date().toLocaleTimeString();
}

function updateMapLayers(corridor, aq, wx) {
    if (!map) return;

    if (aodLayerGroup) aodLayerGroup.clearLayers();
    if (plumeDriftGroup) plumeDriftGroup.clearLayers();

    const lat = corridor.lat;
    const lon = corridor.lon;
    const aod = aq.aod ?? 0.55;
    const windSpeed = wx.windSpeed ?? 12;
    const windDirDeg = wx.windDirection ?? 240;

    const radiusOffset = Math.min(0.25, Math.max(0.08, aod * 0.25));
    const thermalPolygon = L.polygon([
        [lat + radiusOffset, lon - radiusOffset],
        [lat + (radiusOffset * 0.8), lon + (radiusOffset * 1.2)],
        [lat - radiusOffset, lon + (radiusOffset * 0.9)],
        [lat - (radiusOffset * 1.1), lon - (radiusOffset * 0.7)]
    ], {
        color: aod > 0.6 ? '#dc2626' : '#f59e0b',
        fillColor: aod > 0.6 ? '#ef4444' : '#fbbf24',
        fillOpacity: 0.35,
        weight: 2
    }).bindPopup(`
        <div class="text-xs font-sans">
            <b>Satellite AOD Anomaly Layer</b><br>
            Optical Depth: <b>${aod}</b><br>
            Constellation: Sentinel-5P / BRICS-CBERS
        </div>
    `);

    if (aodLayerGroup && isAODActive) thermalPolygon.addTo(aodLayerGroup);

    const blowAngleRad = ((windDirDeg + 180) % 360) * (Math.PI / 180);
    const driftDistDeg = (windSpeed * 3 * 0.009);

    const driftEndLat = lat + (driftDistDeg * Math.cos(blowAngleRad));
    const driftEndLon = lon + (driftDistDeg * Math.sin(blowAngleRad));

    const plumeLine = L.polyline([
        [lat, lon],
        [driftEndLat, driftEndLon]
    ], {
        color: '#0d9488',
        weight: 4,
        dashArray: '6, 6'
    }).bindPopup(`
        <div class="text-xs font-sans">
            <b>3-Hour Transboundary Plume Trajectory</b><br>
            Wind Speed: <b>${windSpeed} km/h</b><br>
            Drift Azimuth: <b>${(windDirDeg + 180) % 360}°</b>
        </div>
    `);

    const coneAngle = 0.25;
    const coneLeftLat = lat + (driftDistDeg * 0.9 * Math.cos(blowAngleRad - coneAngle));
    const coneLeftLon = lon + (driftDistDeg * 0.9 * Math.sin(blowAngleRad - coneAngle));
    const coneRightLat = lat + (driftDistDeg * 0.9 * Math.cos(blowAngleRad + coneAngle));
    const coneRightLon = lon + (driftDistDeg * 0.9 * Math.sin(blowAngleRad + coneAngle));

    const plumeCone = L.polygon([
        [lat, lon],
        [coneLeftLat, coneLeftLon],
        [driftEndLat, driftEndLon],
        [coneRightLat, coneRightLon]
    ], {
        color: '#14b8a6',
        fillColor: '#2dd4bf',
        fillOpacity: 0.25,
        weight: 1
    });

    if (plumeDriftGroup) {
        plumeLine.addTo(plumeDriftGroup);
        plumeCone.addTo(plumeDriftGroup);
    }
}

// --- AI Citizen Photo Analyzer (Clean Environmental Vectors) ---
function loadSamplePhoto(categoryKey) {
    const preset = samplePhotoPresets[categoryKey] || samplePhotoPresets['agricultural_burning'];
    const canvas = document.getElementById('photo-viewfinder-canvas');
    const tag = document.getElementById('photo-overlay-tag');
    const scanStatus = document.getElementById('photo-overlay-opacity');

    if (canvas) canvas.innerHTML = preset.svg;
    if (tag) tag.innerHTML = preset.label;
    if (scanStatus) scanStatus.innerText = 'Ready for AI Scan';

    currentCustomImageBase64 = null;
}

function handleFileUpload(event) {
    const file = event.target.files?.[0] || event.dataTransfer?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        currentCustomImageBase64 = e.target.result;
        const canvas = document.getElementById('photo-viewfinder-canvas');
        const tag = document.getElementById('photo-overlay-tag');
        const scanStatus = document.getElementById('photo-overlay-opacity');

        if (canvas) {
            canvas.innerHTML = `<img src="${currentCustomImageBase64}" class="w-full h-full object-cover" alt="Custom Field Upload">`;
        }
        if (tag) tag.innerHTML = `<i class="fa-solid fa-camera mr-1 text-cyan-400"></i> ${file.name.slice(0, 20)}`;
        if (scanStatus) scanStatus.innerText = 'Custom Ingestion Ready';
    };
    reader.readAsDataURL(file);
}

async function analyzeCitizenPhotoAI() {
    const categorySelect = document.getElementById('sample-photo-select');
    const categoryHint = categorySelect ? categorySelect.value : 'user_uploaded_image';
    const scanBtn = document.getElementById('ai-scan-btn');
    const resultCard = document.getElementById('ai-scan-result-card');
    const scanStatus = document.getElementById('photo-overlay-opacity');

    if (scanBtn) {
        scanBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> Scanning Image...`;
        scanBtn.disabled = true;
    }
    if (scanStatus) scanStatus.innerText = 'Analyzing Plume Density...';

    const corridor = corridorsData[currentCorridorKey] || corridorsData['Delhi'];

    try {
        const res = await fetch(apiUrl('/api/ai/analyze-photo'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                imageBase64: currentCustomImageBase64,
                categoryHint: categoryHint,
                corridorId: corridor.id,
                location: `${corridor.name} Northern Sector`
            })
        });

        const data = await res.json();
        if (data.status === 'success') {
            const analysis = data.analysis;

            if (resultCard) {
                resultCard.classList.remove('hidden');
                document.getElementById('ai-result-category').innerText = analysis.categoryName;
                document.getElementById('ai-result-opacity').innerText = analysis.visualOpacity;
                document.getElementById('ai-result-aqi').innerText = `${analysis.estimatedAQI} AQI`;
                document.getElementById('ai-result-confidence').innerText = analysis.confidence;
            }

            if (scanStatus) scanStatus.innerText = `Classified: ${analysis.visualOpacity}`;

            if (map && analysis.hotspot) {
                map.flyTo([analysis.hotspot.lat, analysis.hotspot.lon], 11);
                setTimeout(() => map.invalidateSize(), 300);
            }

            appendLog(`[AI Vision Scan] Verified ${analysis.categoryName}. Opacity: ${analysis.visualOpacity}, Particulate Index: ${analysis.particulateDensity}. Dropped hotspot on grid.`);
            alert(`AI Analysis Complete!\nSource: ${analysis.categoryName}\nSmoke Opacity: ${analysis.visualOpacity}\nEstimated AQI: ${analysis.estimatedAQI}\nHotspot broadcasted across all BRICS nodes.`);
        }
    } catch (err) {
        console.error('Error during AI photo analysis:', err);
    } finally {
        if (scanBtn) {
            scanBtn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles mr-1"></i> Run AI Scan`;
            scanBtn.disabled = false;
        }
    }
}

// --- Hidden Hotspot & Anomaly Radar ---
async function fetchHotspots(corridorId) {
    try {
        const res = await fetch(apiUrl(`/api/hotspots?corridor=${encodeURIComponent(corridorId)}`));
        const data = await res.json();
        if (data.status === 'success') {
            currentHotspots = data.hotspots;
            renderHotspotsRadar(currentHotspots);
            renderHotspotMarkersOnMap(currentHotspots);
        }
    } catch (err) {
        console.error('Error fetching hotspots:', err);
    }
}

function renderHotspotsRadar(hotspots) {
    const grid = document.getElementById('hotspots-grid');
    const countBadge = document.getElementById('active-hotspots-count');
    if (!grid) return;

    if (countBadge) {
        countBadge.innerText = `${hotspots.length} Hotspots in Corridor`;
    }

    grid.innerHTML = '';

    if (hotspots.length === 0) {
        grid.innerHTML = `<p class="text-xs text-slate-400 py-3 col-span-2 text-center">No unmonitored hidden hotspots detected in this sector.</p>`;
        return;
    }

    hotspots.forEach(hs => {
        const card = document.createElement('div');
        card.className = "bg-white/90 dark:bg-slate-800/90 rounded-2xl p-3.5 border border-rose-200 dark:border-rose-900/60 shadow-sm space-y-2 hover:border-rose-400 transition";

        let typeIcon = 'fa-fire text-amber-500';
        if (hs.type === 'industrial_flare') typeIcon = 'fa-industry text-rose-500';
        else if (hs.type === 'vehicular_inversion') typeIcon = 'fa-car-side text-yellow-500';

        card.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="flex items-center space-x-2">
                    <i class="fa-solid ${typeIcon} text-sm"></i>
                    <div>
                        <p class="font-black text-xs text-slate-900 dark:text-white">${hs.title}</p>
                        <p class="text-[10px] text-slate-500 dark:text-slate-400">${hs.detectedBy}</p>
                    </div>
                </div>
                <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    hs.severity === 'Critical' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }">${hs.severity}</span>
            </div>
            <p class="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">${hs.description}</p>
            <div class="flex justify-between items-center text-[10px] pt-1 border-t border-slate-100 dark:border-slate-700">
                <span class="font-bold text-rose-600 dark:text-rose-400">Est. AQI: ${hs.estimatedAQI} (${hs.opacityScore})</span>
                <div class="flex space-x-1.5">
                    <button onclick="focusHotspotOnMap(${hs.lat}, ${hs.lon})" class="px-2 py-1 bg-indigo-50 dark:bg-slate-700 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded font-bold cursor-pointer transition">Focus</button>
                    <button onclick="triggerRapidAuthorityAlert('${hs.id}')" class="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold cursor-pointer transition">Alert</button>
                </div>
            </div>
        `;

        grid.appendChild(card);
    });
}

function renderHotspotMarkersOnMap(hotspots) {
    if (!hotspotMarkersGroup) return;
    hotspotMarkersGroup.clearLayers();

    if (!isHotspotActive) return;

    hotspots.forEach(hs => {
        let haloColor = '#ef4444';
        if (hs.type === 'agricultural_burning') haloColor = '#f97316';
        else if (hs.type === 'vehicular_inversion') haloColor = '#eab308';

        const marker = L.circleMarker([hs.lat, hs.lon], {
            radius: 12,
            color: '#ffffff',
            fillColor: haloColor,
            fillOpacity: 0.85,
            weight: 2
        }).bindPopup(`
            <div class="text-xs font-sans">
                <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-600 text-white">${hs.severity} HOTSPOT</span>
                <p class="font-black mt-1 text-sm">${hs.title}</p>
                <p class="text-slate-500">${hs.description}</p>
                <p class="mt-1"><b>Estimated AQI:</b> <span style="color:${haloColor}; font-weight:bold">${hs.estimatedAQI}</span> &bull; <b>${hs.opacityScore}</b></p>
                <p class="text-[10px] text-slate-400">Detected: ${hs.detectedBy}</p>
                <button onclick="triggerRapidAuthorityAlert('${hs.id}')" style="margin-top:6px; background:#dc2626; color:white; padding:4px 8px; border-radius:6px; font-weight:bold; cursor:pointer; width:100%;">Dispatch Rapid Intervention</button>
            </div>
        `);

        marker.addTo(hotspotMarkersGroup);
    });
}

function focusHotspotOnMap(lat, lon) {
    switchSlideWindow(0);
    if (map) {
        map.flyTo([lat, lon], 12, { duration: 1 });
        setTimeout(() => map.invalidateSize(), 300);
    }
}

function toggleHotspotLayer() {
    isHotspotActive = !isHotspotActive;
    const btn = document.getElementById('hotspot-toggle-btn');
    const t = i18nDictionary[currentLanguage] || i18nDictionary.en;

    if (!map || !hotspotMarkersGroup) return;

    if (isHotspotActive) {
        map.addLayer(hotspotMarkersGroup);
        renderHotspotMarkersOnMap(currentHotspots);
        if (btn) {
            btn.className = "bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer";
            btn.innerHTML = `<i class="fa-solid fa-fire mr-1"></i> <span id="lbl-hotspot-toggle">${t.lblHotspotToggleOn}</span>`;
        }
        appendLog(`[Hotspot Layer] Anomaly Radar overlay enabled.`);
    } else {
        map.removeLayer(hotspotMarkersGroup);
        if (btn) {
            btn.className = "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer";
            btn.innerHTML = `<i class="fa-solid fa-fire mr-1"></i> <span id="lbl-hotspot-toggle">${t.lblHotspotToggleOff}</span>`;
        }
        appendLog(`[Hotspot Layer] Anomaly Radar overlay disabled.`);
    }
}

// --- AI Air Quality Spike Forecasting ---
async function fetchSpikeForecast(corridorId) {
    try {
        const res = await fetch(apiUrl(`/api/forecast/spikes?corridor=${encodeURIComponent(corridorId)}`));
        const data = await res.json();
        if (data.status === 'success') {
            renderSpikeCards(data);
        }
    } catch (err) {
        console.error('Spike forecast fetch failed:', err);
    }
}

function renderSpikeCards(data) {
    const container = document.getElementById('spike-cards-container');
    const riskBadge = document.getElementById('inversion-risk-badge');
    if (!container) return;

    if (riskBadge) {
        riskBadge.innerText = `Inversion Risk: ${data.inversionRisk || 'MODERATE'}`;
        riskBadge.className = data.inversionRisk === 'CRITICAL' || data.inversionRisk === 'HIGH'
            ? "text-xs font-black text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950 px-3 py-1 rounded-xl border border-rose-200 dark:border-rose-900"
            : "text-xs font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-3 py-1 rounded-xl border border-emerald-200 dark:border-emerald-900";
    }

    container.innerHTML = '';

    data.spikes.forEach(spike => {
        const isSpikeUp = spike.spikeDeltaPct.startsWith('+');
        const card = document.createElement('div');
        card.className = "p-4 bg-white/90 dark:bg-slate-800/90 rounded-2xl border border-indigo-100 dark:border-slate-700 shadow-sm space-y-2 relative overflow-hidden";

        card.innerHTML = `
            <div class="flex justify-between items-center">
                <span class="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">${spike.horizon} Horizon</span>
                <span class="text-[10px] font-black px-2 py-0.5 rounded ${
                    isSpikeUp ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                }">${spike.spikeDeltaPct} Spike</span>
            </div>
            <div>
                <p class="text-xl font-black ${isSpikeUp ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}">${spike.predictedAQI} AQI</p>
                <p class="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">${spike.timeWindow}</p>
            </div>
            <p class="text-[11px] text-slate-600 dark:text-slate-300 leading-snug"><b>Driver:</b> ${spike.primaryFactor}</p>
            <div class="pt-2 border-t border-slate-100 dark:border-slate-700 text-[10px] text-indigo-700 dark:text-indigo-300">
                <b>Action:</b> ${spike.recommendedIntervention}
            </div>
        `;

        container.appendChild(card);
    });
}

// --- BRICS Federated Model Mesh & Shared Resources ---
async function fetchFederatedModels() {
    try {
        const res = await fetch(apiUrl('/api/federated-models'));
        const data = await res.json();
        if (data.status === 'success') {
            currentFederatedModels = data.models;
            renderFederatedModels(currentFederatedModels);
        }
    } catch (err) {
        console.error('Error fetching federated models:', err);
    }
}

function renderFederatedModels(models) {
    const container = document.getElementById('federated-models-container');
    if (!container) return;

    container.innerHTML = '';

    models.forEach(m => {
        const card = document.createElement('div');
        card.className = "p-3.5 bg-white/90 dark:bg-slate-800/90 rounded-2xl border border-teal-200/70 dark:border-slate-700 shadow-sm space-y-2 hover:border-teal-400 transition";

        card.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <p class="font-black text-xs text-slate-900 dark:text-white flex items-center">
                        <i class="fa-solid fa-microchip mr-1.5 text-teal-600"></i> ${m.name}
                    </p>
                    <p class="text-[10px] text-slate-500 dark:text-slate-400">${m.domain}</p>
                </div>
                <span class="px-2 py-0.5 rounded text-[10px] font-black bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">${m.accuracy}% Acc</span>
            </div>
            <div class="flex justify-between items-center text-[10px] text-slate-600 dark:text-slate-400">
                <span><b>Lead:</b> ${m.leadNations.join(', ')}</span>
                <span class="font-mono text-slate-400">${m.globalParameters}</span>
            </div>
            <div class="flex justify-between items-center pt-1.5 border-t border-slate-100 dark:border-slate-700 text-[10px]">
                <span class="text-slate-400">${m.lastFederatedSync}</span>
                <button onclick="syncFederatedModel('${m.id}')" class="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold cursor-pointer transition">
                    <i class="fa-solid fa-arrows-rotate mr-1"></i> Sync Weights
                </button>
            </div>
        `;

        container.appendChild(card);
    });
}

async function syncFederatedModel(modelId) {
    try {
        const res = await fetch(apiUrl('/api/federated-models/sync'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ modelId })
        });
        const data = await res.json();
        if (data.status === 'synced') {
            fetchFederatedModels();
            alert(`Model [${data.model.name}] successfully synchronized across all BRICS edge nodes!\nNew Accuracy: ${data.model.accuracy}%`);
        }
    } catch (err) {
        console.error('Error syncing federated model:', err);
    }
}

async function syncAllFederatedModels() {
    appendLog(`[Federated Network] Batch synchronizing all 5 BRICS ML model weights across Brazil, Russia, India, China, and South Africa...`);
    for (const m of currentFederatedModels) {
        await fetch(apiUrl('/api/federated-models/sync'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ modelId: m.id })
        });
    }
    await fetchFederatedModels();
    alert('All 5 BRICS Federated ML Models synchronized successfully across member computing clusters!');
}

async function fetchSharedResources() {
    try {
        const res = await fetch(apiUrl('/api/shared-resources'));
        const data = await res.json();
        if (data.status === 'success') {
            currentSharedResources = data.resources;
            renderSharedResources(currentSharedResources);
        }
    } catch (err) {
        console.error('Error fetching shared resources:', err);
    }
}

function renderSharedResources(resources) {
    const list = document.getElementById('shared-resources-list');
    if (!list) return;

    list.innerHTML = '';

    resources.forEach(r => {
        const item = document.createElement('div');
        item.className = "flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60";
        item.innerHTML = `
            <div>
                <p class="font-bold text-[11px] text-slate-800 dark:text-slate-200">${r.name}</p>
                <p class="text-[10px] text-slate-500">${r.location} &bull; ${r.availableUnits} Available</p>
            </div>
            <button onclick="deploySharedResource('${r.id}')" class="px-2 py-1 text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer transition">Deploy</button>
        `;
        list.appendChild(item);
    });
}

async function deploySharedResource(resourceId) {
    const corridor = corridorsData[currentCorridorKey] || corridorsData['Delhi'];
    try {
        const res = await fetch(apiUrl('/api/shared-resources/deploy'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resourceId, targetCorridor: corridor.id })
        });
        const data = await res.json();
        if (data.status === 'deployed') {
            alert(`Resource "${data.resource}" successfully deployed to ${data.targetCorridor}!`);
        }
    } catch (err) {
        console.error('Deploy resource error:', err);
    }
}

// --- Rapid Authority Intervention Alert ---
async function triggerRapidAuthorityAlert(hotspotId) {
    const corridor = corridorsData[currentCorridorKey] || corridorsData['Delhi'];

    try {
        const res = await fetch(apiUrl('/api/alerts/rapid-intervention'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ corridorId: corridor.id, hotspotId, severity: 'Stage-3 Emergency' })
        });

        const data = await res.json();
        if (data.status === 'dispatched') {
            const sops = data.alert.actionableSOPs.join('\n');
            alert(`RAPID AUTHORITY INTERVENTION DISPATCHED!\nAlert ID: ${data.alert.alertId}\nTarget: ${data.alert.targetHotspot}\nLocation: ${data.alert.corridor} (${data.alert.country})\n\nMandated SOPs:\n${sops}`);
            appendLog(`[RAPID ALERT TRANSMITTED] Sent to ${corridor.country} State Pollution Control Board & Traffic Ministry.`);
        }
    } catch (err) {
        console.error('Rapid alert error:', err);
    }
}

// --- Dynamic AI Policy Advisor Directive ---
function generateAIPolicyDirective(corridor, aq, wx) {
    const policyElem = document.getElementById('ai-policy-text');
    if (!policyElem) return;

    const aqi = aq.usAqi || corridor.baseAqi || 100;
    const windSpeed = wx.windSpeed || 10;
    const dominant = aq.pm25 > 60 ? 'PM2.5 Fine Particulates' : (aq.dust > 150 ? 'Mineral Dust Aerosols' : (aq.no2 > 50 ? 'NO₂ Industrial Flux' : 'PM10 Particulates'));

    let directive = '';
    if (aqi > 200) {
        directive = `[CRITICAL DIRECTIVE for ${corridor.name}]: AQI is hazardous (${aqi}). Primary driver is <b>${dominant}</b> with wind dispersion at ${windSpeed} km/h. Recommend immediate Stage-3 industrial production curbs, heavy truck traffic diversion onto outer peripheries, and high-altitude misting deployment.`;
    } else if (aqi > 150) {
        directive = `[POLICY ADVISORY for ${corridor.name}]: Elevated particulate accumulation (${aqi} AQI). Enforce automated dust suppression on transit arteries and restrict diesel logistics during peak morning thermal inversion hours.`;
    } else if (aqi > 100) {
        directive = `[STANDARD DIRECTIVE for ${corridor.name}]: Moderate air quality (${aqi} AQI). Maintain cross-border atmospheric sensor synchronicity with BRICS partner nodes and sustain regional renewable energy dispatch quotas.`;
    } else {
        directive = `[OPTIMAL OPERATING STATE for ${corridor.name}]: Air quality is favorable (${aqi} AQI). Atmospheric dispersion rate is stable. Prioritize long-term clean energy infrastructure transition and cross-border data telemetry federation.`;
    }

    policyElem.innerHTML = directive;
}

// --- Real-Time Health & Socio-Economic Impact Calculation ---
function updateHealthImpact(aqi) {
    const erElem = document.getElementById('health-er');
    const pedElem = document.getElementById('health-ped');
    const lossElem = document.getElementById('health-loss');
    const mortElem = document.getElementById('health-mortality');

    if (!erElem || !pedElem || !lossElem || !mortElem) return;

    const safeAqi = Math.max(15, parseFloat(aqi) || 150);
    const erStrain = (safeAqi * 0.14).toFixed(1);
    const pedAdmissions = Math.round(safeAqi * 4.8);
    const prodLoss = (safeAqi * 0.075).toFixed(1);
    const mortBurden = (safeAqi * 0.055).toFixed(1);

    const severity = safeAqi > 200 ? 'Critical' : (safeAqi > 150 ? 'Substantial' : (safeAqi > 100 ? 'Elevated' : 'Nominal'));

    erElem.innerText = `+${erStrain}% (${severity})`;
    pedElem.innerText = `${pedAdmissions.toLocaleString()} cases / day`;
    lossElem.innerText = `$${prodLoss}M / day`;
    mortElem.innerText = `${mortBurden} DALYs per 100k`;
}

// --- Ministerial Climate Action Brief Modal Logic ---
function openMinisterialBriefModal() {
    const modal = document.getElementById('ministerial-modal');
    const content = document.getElementById('brief-modal-content');
    const corridor = corridorsData[currentCorridorKey] || corridorsData['Delhi'];
    if (!modal || !content) return;

    const aqi = currentAirQuality.usAqi || corridor.baseAqi || 150;
    const timeStr = new Date().toLocaleString();

    content.innerHTML = `
        <div class="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div class="flex justify-between items-center">
                <span class="font-black text-sm">${corridor.flag} ${corridor.name}</span>
                <span class="px-2.5 py-1 rounded font-black uppercase text-xs ${aqi > 150 ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}">AQI ${aqi}</span>
            </div>
            <p class="text-slate-500"><b>Jurisdiction:</b> ${corridor.country} &bull; ${corridor.region}</p>
            <p class="text-slate-500"><b>Briefing Generated:</b> ${timeStr}</p>
        </div>

        <div class="space-y-1.5">
            <p class="font-black uppercase text-slate-700 dark:text-slate-300">1. Atmospheric Telemetry & Risk Vector</p>
            <p class="text-slate-600 dark:text-slate-400">Primary pollutant is <b>${corridor.dominantPollutant}</b> with wind dispersion at <b>${currentWeather.windSpeed || 12} km/h</b>. Nighttime boundary layer trapping index is elevated.</p>
        </div>

        <div class="space-y-1.5">
            <p class="font-black uppercase text-slate-700 dark:text-slate-300">2. Socio-Economic Impact Assessment</p>
            <ul class="list-disc pl-5 text-slate-600 dark:text-slate-400 space-y-1">
                <li>Emergency respiratory admissions projected at <b>${Math.round(aqi * 4.8)} cases / day</b>.</li>
                <li>Estimated daily economic productivity loss of <b>$${(aqi * 0.075).toFixed(1)}M USD</b>.</li>
                <li>Avoidable disease burden: <b>${(aqi * 0.055).toFixed(1)} DALYs per 100k residents</b>.</li>
            </ul>
        </div>

        <div class="space-y-1.5">
            <p class="font-black uppercase text-rose-700 dark:text-rose-400">3. Mandated Executive SOPs for Immediate Enforcement</p>
            <ul class="list-disc pl-5 text-slate-700 dark:text-slate-300 font-semibold space-y-1">
                <li>Activate automated road dust misting cannons on outer arterial ring roads.</li>
                <li>Divert diesel freight transit between 20:00 - 06:00 to bypass thermal inversion zones.</li>
                <li>Sync CBERS/Sentinel satellite optical observation windows with municipal taskforces.</li>
                <li>Alert cross-border downwind districts regarding 3-hour transboundary plume drift.</li>
            </ul>
        </div>
    `;

    modal.classList.remove('hidden');
}

function closeMinisterialBriefModal() {
    const modal = document.getElementById('ministerial-modal');
    if (modal) modal.classList.add('hidden');
}

// --- Emergency Ministerial Webhook Dispatcher ---
async function dispatchWebhook() {
    const corridor = corridorsData[currentCorridorKey] || { name: 'New Delhi NCR', country: 'India', id: 'Delhi' };
    const timestamp = new Date().toLocaleTimeString();

    const slider = document.getElementById('treaty-slider');
    if (slider) {
        slider.value = 50;
        applyTreatySimulation(50);
    }

    const badge = document.getElementById('aqi-badge');
    if (badge) {
        badge.className = "px-4 py-1.5 rounded-2xl text-xs font-black bg-rose-600 text-white border border-rose-400 shadow-lg animate-pulse";
        badge.innerText = "CRITICAL: Stage-3 Lockdown Protocol Active";
    }

    try {
        if (socket && socket.connected) {
            socket.emit('dispatch-webhook', { corridorId: corridor.id });
        } else {
            await fetch(apiUrl('/api/dispatch'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ corridorId: corridor.id, severity: 'Stage-3' })
            });
        }

        appendLog(`[Emergency Dispatch] Stage-3 ministerial traffic & emission throttling protocol dispatched for ${corridor.name}.`);
        alert(`Stage-3 Emergency Ministerial Webhook Dispatched Successfully for ${corridor.name} at ${timestamp}!`);
    } catch (err) {
        console.error('Dispatch error:', err);
    }
}

function triggerEmergencyUI(alertData) {
    appendLog(`[EMERGENCY BROADCAST] ${alertData.message}`);
    const badge = document.getElementById('aqi-badge');
    if (badge) {
        badge.className = "px-4 py-1.5 rounded-2xl text-xs font-black bg-rose-600 text-white border border-rose-400 shadow-lg animate-pulse";
        badge.innerText = `EMERGENCY ALERT: ${alertData.corridorName}`;
    }
}

// --- Multilateral Treaty Emission Reduction Simulator ---
function applyTreatySimulation(val) {
    const valElem = document.getElementById('treaty-slider-val');
    if (valElem) valElem.innerText = `Reduction Target: -${val}%`;

    if (trendChartInstance && currentAirQuality.trend) {
        const baseData = currentAirQuality.trend.data;
        const scaledData = baseData.map(v => Math.round(v * (1 - (val / 100))));
        trendChartInstance.data.datasets[0].data = scaledData;
        trendChartInstance.update();
    }

    appendLog(`[Treaty Simulator] Applied -${val}% emission reduction policy across member corridors.`);
}

// --- Satellite Constellation Telemetry Loop ---
function startRealTimeSatelliteStream() {
    if (satelliteInterval) clearInterval(satelliteInterval);

    satelliteInterval = setInterval(() => {
        satelliteCountdown--;
        const countElem = document.getElementById('brics-countdown');
        if (countElem) countElem.innerText = satelliteCountdown;

        if (satelliteCountdown <= 0) {
            satelliteCountdown = 10;
            pollSatelliteConstellation();
        }
    }, 1000);
}

function forceSatelliteSync() {
    satelliteCountdown = 10;
    pollSatelliteConstellation();
    appendLog(`[Satellite Telemetry] Forced instant handshake with CBERS / Sentinel / INSAT constellation.`);
}

function pollSatelliteConstellation() {
    const baseAod = currentAirQuality.aod || 0.520;
    const variation = (Math.random() - 0.5) * 0.04;
    const updatedAod = Math.max(0.1, (baseAod + variation)).toFixed(3);

    const aodDisplay = document.getElementById('brics-live-aod');
    if (aodDisplay) {
        aodDisplay.innerHTML = `${updatedAod} (Sync: <span id="brics-countdown">10</span>s)`;
    }
}

// --- Chart.js Initializations & Updaters ---
function initCharts() {
    const trendElem = document.getElementById('trendChart');
    if (trendElem) {
        const ctxTrend = trendElem.getContext('2d');
        trendChartInstance = new Chart(ctxTrend, {
            type: 'line',
            data: {
                labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Today'],
                datasets: [{
                    label: 'PM2.5 Live Concentration (µg/m³)',
                    data: [52, 48, 62, 58, 70, 65, 54.6],
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.15)',
                    fill: true,
                    tension: 0.35,
                    pointRadius: 4,
                    pointBackgroundColor: '#4f46e5'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { grid: { color: 'rgba(0,0,0,0.05)' }, title: { display: true, text: 'µg/m³' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    const sourceElem = document.getElementById('sourceChart');
    if (sourceElem) {
        const ctxSource = sourceElem.getContext('2d');
        sourceChartInstance = new Chart(ctxSource, {
            type: 'doughnut',
            data: {
                labels: ['Industrial', 'Vehicular', 'Agricultural', 'Construction'],
                datasets: [{
                    data: [35, 38, 17, 10],
                    backgroundColor: ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b'],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { boxWidth: 10, font: { size: 10, weight: 'bold' } }
                    }
                },
                cutout: '65%'
            }
        });
    }
}

function updateSourceChart(corridor) {
    if (!sourceChartInstance || !corridor.defaultSources) return;

    const labels = Object.keys(corridor.defaultSources);
    const data = Object.values(corridor.defaultSources);

    sourceChartInstance.data.labels = labels;
    sourceChartInstance.data.datasets[0].data = data;
    sourceChartInstance.update();
}

function toggleHistoricalBaseline() {
    yoyBaselineActive = !yoyBaselineActive;
    const btn = document.getElementById('baseline-toggle-btn');
    const t = i18nDictionary[currentLanguage] || i18nDictionary.en;

    if (btn) {
        btn.innerHTML = `<i class="fa-solid fa-clock-rotate-left mr-1"></i> <span id="lbl-baseline-toggle">${yoyBaselineActive ? 'YoY Baseline: ON' : 'YoY Baseline: OFF'}</span>`;
        btn.className = yoyBaselineActive
            ? "px-2.5 py-1 text-[10px] font-bold bg-indigo-600 text-white rounded-lg transition cursor-pointer"
            : "px-2.5 py-1 text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900 transition cursor-pointer";
    }

    if (trendChartInstance) {
        if (yoyBaselineActive) {
            const currentData = trendChartInstance.data.datasets[0].data;
            const baselineData = currentData.map(v => Math.round(v * 1.12));
            trendChartInstance.data.datasets.push({
                label: 'Previous Year Historical Baseline',
                data: baselineData,
                borderColor: '#94a3b8',
                borderDash: [5, 5],
                fill: false,
                tension: 0.35,
                pointRadius: 3
            });
        } else {
            if (trendChartInstance.data.datasets.length > 1) {
                trendChartInstance.data.datasets.pop();
            }
        }
        trendChartInstance.update();
    }

    appendLog(`[Historical Baseline] YoY Baseline Comparison set to ${yoyBaselineActive ? 'ACTIVE' : 'INACTIVE'}.`);
}

function toggleAODLayer() {
    isAODActive = !isAODActive;
    const btn = document.getElementById('aod-toggle-btn');
    const t = i18nDictionary[currentLanguage] || i18nDictionary.en;

    if (!map || !aodLayerGroup) return;

    if (isAODActive) {
        map.addLayer(aodLayerGroup);
        if (btn) {
            btn.classList.add('bg-indigo-600', 'text-white');
            btn.classList.remove('bg-indigo-50', 'text-indigo-700');
        }
        appendLog(`[Map Layer] Satellite AOD Thermal Layer enabled.`);
    } else {
        map.removeLayer(aodLayerGroup);
        if (btn) {
            btn.classList.remove('bg-indigo-600', 'text-white');
            btn.classList.add('bg-indigo-50', 'text-indigo-700');
        }
        appendLog(`[Map Layer] Satellite AOD Thermal Layer disabled.`);
    }
}

function togglePlumeDriftVectors() {
    isPlumeDriftActive = !isPlumeDriftActive;
    const btn = document.getElementById('plume-drift-btn');
    const t = i18nDictionary[currentLanguage] || i18nDictionary.en;

    if (!map || !plumeDriftGroup) return;

    if (isPlumeDriftActive) {
        map.addLayer(plumeDriftGroup);
        if (btn) {
            btn.classList.remove('bg-teal-600', 'hover:bg-teal-700');
            btn.classList.add('bg-slate-800', 'text-teal-400', 'border', 'border-teal-500');
            btn.innerHTML = `<i class="fa-solid fa-arrows-split-up-and-left mr-1"></i> <span id="btn-plume-drift">${t.btnPlumeDriftDisable}</span>`;
        }
        appendLog(`[Plume Simulator] 3-Hour Plume Trajectory projection activated on map.`);
    } else {
        map.removeLayer(plumeDriftGroup);
        if (btn) {
            btn.classList.remove('bg-slate-800', 'text-teal-400', 'border', 'border-teal-500');
            btn.classList.add('bg-teal-600', 'hover:bg-teal-700');
            btn.innerHTML = `<i class="fa-solid fa-arrows-split-up-and-left mr-1"></i> <span id="btn-plume-drift">${t.btnPlumeDriftEnable}</span>`;
        }
        appendLog(`[Plume Simulator] 3-Hour Plume Trajectory projection hidden.`);
    }
}

function setupEventListeners() {
    window.addEventListener('resize', () => {
        if (map) map.invalidateSize();
    });

    const dropzone = document.getElementById('photo-preview-box');
    if (dropzone) {
        dropzone.addEventListener('dragover', (event) => {
            event.preventDefault();
            dropzone.classList.add('photo-dropzone-active');
        });
        dropzone.addEventListener('dragleave', () => dropzone.classList.remove('photo-dropzone-active'));
        dropzone.addEventListener('drop', (event) => {
            event.preventDefault();
            dropzone.classList.remove('photo-dropzone-active');
            handleFileUpload(event);
        });
    }
}

// --- Terminal Log Stream & Export ---
function appendLog(message) {
    const stream = document.getElementById('log-stream');
    if (!stream) return;

    const timeString = new Date().toLocaleTimeString();
    const p = document.createElement('p');
    p.className = "text-slate-900 flex items-center justify-between border-t border-slate-200 pt-1 text-[11px]";
    p.innerHTML = `<span>${message}</span><span class="text-[10px] text-slate-700 font-mono ml-2 whitespace-nowrap">${timeString}</span>`;

    stream.prepend(p);

    if (stream.children.length > 35) {
        stream.removeChild(stream.lastChild);
    }
}

function clearDispatchLogs() {
    const stream = document.getElementById('log-stream');
    if (stream) {
        stream.innerHTML = `<p class="text-slate-900 text-center py-2 text-xs">[Federated dispatch logs cleared by operator]</p>`;
    }
}

function exportAuditLogs(format = 'csv') {
    const stream = document.getElementById('log-stream');
    const corridor = corridorsData[currentCorridorKey] || { name: 'Delhi', country: 'India' };
    const dateStr = new Date().toISOString().slice(0, 10);

    if (format === 'csv') {
        let csvContent = "data:text/csv;charset=utf-8,Timestamp,Corridor,Country,US_AQI,PM25,NO2,SO2,CO,Event_Log\n";
        if (stream) {
            const rows = stream.querySelectorAll('p');
            rows.forEach(row => {
                const text = row.innerText.replace(/"/g, '""');
                csvContent += `"${new Date().toLocaleTimeString()}","${corridor.name}","${corridor.country}","${currentAirQuality.usAqi || ''}","${currentAirQuality.pm25 || ''}","${currentAirQuality.no2 || ''}","${currentAirQuality.so2 || ''}","${currentAirQuality.co || ''}","${text}"\n`;
            });
        }
        downloadFile(csvContent, `brics_audit_${corridor.id.toLowerCase()}_${dateStr}.csv`);
    } else if (format === 'json') {
        const auditPayload = {
            exportDate: new Date().toISOString(),
            corridor: corridor,
            telemetry: currentAirQuality,
            atmospheric: currentWeather,
            hotspots: currentHotspots,
            federatedModels: currentFederatedModels,
            logs: Array.from(stream ? stream.querySelectorAll('p') : []).map(p => p.innerText)
        };
        const jsonContent = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(auditPayload, null, 2));
        downloadFile(jsonContent, `brics_audit_${corridor.id.toLowerCase()}_${dateStr}.json`);
    }

    appendLog(`[Audit Export] Telemetry audit logs downloaded as ${format.toUpperCase()}.`);
}

function downloadFile(content, fileName) {
    const link = document.createElement("a");
    link.setAttribute("href", content);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
    appendLog(`[Theme] Switched display color mode.`);
}
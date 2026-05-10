// Подключаем Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand();

// ID и имя игрока
const userId = tg.initDataUnsafe?.user?.id;
const userName = tg.initDataUnsafe?.user?.first_name || 'Игрок';

// ============ БАЗА МАШИН ============
const CAR_TEMPLATES = [
    { id: 1,  name: 'Ржавый Запорожец',  basePrice: 50,    income: 1,   emoji: '🚗' },
    { id: 2,  name: 'Ушатанная Девятка', basePrice: 1000,   income: 2,   emoji: '🚙' },
    { id: 3,  name: 'Лада Приора',       basePrice: 20000,   income: 4,   emoji: '🏎️' },
    { id: 4,  name: 'Toyota Camry',      basePrice: 400000,   income: 8,   emoji: '🚘' },
    { id: 5,  name: 'BMW 3 (битая)',     basePrice: 1000000,   income: 15,  emoji: '🚙' },
    { id: 6,  name: 'Porsche Cayenne',   basePrice: 5000000,  income: 25,  emoji: '🏎️' },
    { id: 7,  name: 'Geländewagen',      basePrice: 10000000,  income: 50,  emoji: '🚛' },
    { id: 8,  name: 'Lamborghini',       basePrice: 50000000,  income: 100, emoji: '🏎️' },
    { id: 9,  name: 'Bugatti',           basePrice: 100000000, income: 200, emoji: '🏎️' },
    { id: 10, name: 'Золотая Tesla',     basePrice: 250000000, income: 500, emoji: '⚡' }
];

// ============ ИГРОК ============
let player = {
    id: userId,
    name: userName,
    balance: 500,
    garage: [],
    ref_link: '',
    ref_count: 0,
    last_farm: 0
};

// ============ ВСЕ ИГРОКИ ============
let allPlayers = {};

// ============ ЭКРАНЫ ============
function hideAllScreens() {
    const screens = [
        'garage-screen',
        'market-screen',
        'player-garage-screen',
        'invite-screen',
        'farm-screen'
    ];
    screens.forEach(id => {
        const el = document.getElementById(id);
        if (el) el

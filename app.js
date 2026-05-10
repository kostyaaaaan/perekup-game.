// ВСТАВЬ СВОИ ДАННЫЕ ↓
const BIN_ID = '6a005098adc21f119a7be48c';
const MASTER_KEY = '$2a$10$dtNfbApmiayE.YLsXsVpG.gAaPUEWPJu1ZhGPVizLklxuYC9BccdG';
const BIN_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

const tg = window.Telegram.WebApp;
tg.expand();

const userId = tg.initDataUnsafe?.user?.id;
const userName = tg.initDataUnsafe?.user?.first_name || 'Игрок';

// ============ БАЗА МАШИН ============
const CAR_TEMPLATES = [
    { id: 1,  name: 'Ржавый Запорожец',  basePrice: 50,    income: 1,   emoji: '🚗' },
    { id: 2,  name: 'Ушатанная Девятка', basePrice: 100,   income: 2,   emoji: '🚙' },
    { id: 3,  name: 'Лада Приора',       basePrice: 200,   income: 4,   emoji: '🏎️' },
    { id: 4,  name: 'Toyota Camry',      basePrice: 400,   income: 8,   emoji: '🚘' },
    { id: 5,  name: 'BMW 3 (битая)',     basePrice: 800,   income: 15,  emoji: '🚙' },
    { id: 6,  name: 'Porsche Cayenne',   basePrice: 1500,  income: 25,  emoji: '🏎️' },
    { id: 7,  name: 'Geländewagen',      basePrice: 3000,  income: 50,  emoji: '🚛' },
    { id: 8,  name: 'Lamborghini',       basePrice: 6000,  income: 100, emoji: '🏎️' },
    { id: 9,  name: 'Bugatti',           basePrice: 12000, income: 200, emoji: '🏎️' },
    { id: 10, name: 'Золотая Tesla',     basePrice: 25000, income: 500, emoji: '⚡' }
];

// ============ ЛИГИ (ИСПРАВЛЕНО) ============
const LEAGUES = [
    { name: '🔰 Новичок',    minBalance: 0,      maxBalance: 999,    cssClass: 'league-novice' },
    { name: '🥉 Бронза',     minBalance: 1000,   maxBalance: 4999,   cssClass: 'league-bronze' },
    { name: '🥈 Серебро',    minBalance: 5000,   maxBalance: 19999,  cssClass: 'league-silver' },
    { name: '🥇 Золото',     minBalance: 20000,  maxBalance: 99999,  cssClass: 'league-gold' },
    { name: '💎 Платина',    minBalance: 100000, maxBalance: 499999, cssClass: 'league-platinum' },
    { name: '👑 Алмаз',      minBalance: 500000, maxBalance: Infinity,cssClass: 'league-diamond' }
];

function getPlayerLeague(balance) {
    return LEAGUES.find(l => balance >= l.minBalance && balance <= l.maxBalance) || LEAGUES[0];
}

// ============ ИГРОК ============
let player = {
    id: userId,
    name: userName,
    balance: 500,
    garage: [],
    ref_link: '',
    ref_count: 0,
    friends: [],
    last_farm: 0
};

let allPlayers = {};

// ============ JSONBIN ============
async function loadAllData() {
    try {
        const res = await fetch(BIN_URL + '/latest', {
            headers: { 'X-Master-Key': MASTER_KEY }
        });
        const data = await res.json();
        allPlayers = data.record || {};
        
        if (allPlayers[userId]) {
            player = allPlayers[userId];
            player.id = userId;
            player.name = player.name || userName;
            player.friends = player.friends || [];
            player.garage = player.garage || [];
        } else {
            initPlayer();
        }
    } catch (e) {
        console.error('Ошибка загрузки:', e);
        loadFromLocal();
    }
    updateUI();
}

function loadFromLocal() {
    const saved = localStorage.getItem(`player_${userId}`);
    if (saved) {
        player = JSON.parse(saved);
    } else {
        initPlayer();
    }
    allPlayers[userId] = player;
}

async function saveAllData() {
    allPlayers[userId] = player;
    localStorage.setItem(`player_${userId}`, JSON.stringify(player));
    try {
        await fetch(BIN_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-Master-Key': MASTER_KEY },
            body: JSON.stringify(allPlayers)
        });
    } catch (e) {
        console.error('Ошибка сохранения:', e);
    }
}

// ============ ЭКРАНЫ ============
const SCREENS = ['garage-screen','market-screen','player-garage-screen','invite-screen','friends-screen','rating-screen','farm-screen'];

function hideAllScreens() {
    SCREENS.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
}

function showGarage() { hideAllScreens(); $('#garage-screen').classList.remove('hidden'); renderMyGarage(); }
function hideGarage() { $('#garage-screen').classList.add('hidden'); }

function showMarket() { hideAllScreens(); $('#market-screen').classList.remove('hidden'); renderMarket(); }
function hideMarket() { $('#market-screen').classList.add('hidden'); }

function showPlayerGarage(pid) { hideAllScreens(); $('#player-garage-screen').classList.remove('hidden'); renderPlayerGarage(pid); }
function hidePlayerGarage() { $('#player-garage-screen').classList.add('hidden'); }

function showInvite() {
    hideAllScreens();
    $('#invite-screen').classList.remove('hidden');
    $('#ref-link').textContent = player.ref_link;
    $('#ref-count').textContent = player.ref_count;
}
function hideInvite() { $('#invite-screen').classList.add('hidden'); }

function showFriends() { hideAllScreens(); $('#friends-screen').classList.remove('hidden'); renderFriends(); }
function hideFriends() { $('#friends-screen').classList.add('hidden'); }

function showRating() { hideAllScreens(); $('#rating-screen').classList.remove('hidden'); renderRating(); }
function hideRating() { $('#rating-screen').classList.add('hidden'); }

function showFarm() { hideAllScreens(); $('#farm-screen').classList.remove('hidden'); checkFarmCooldown(); }
function hideFarm() { $('#farm-screen').classList.add('hidden'); }

function $(id) { return document.getElementById(id); }

// ============ ОБНОВЛЕНИЕ UI ============
function updateUI() {
    updateBalanceDisplay();
    updateLeagueBadge();
}

function updateBalanceDisplay() {
    const el = $('#balance');
    if (el) el.textContent = player.balance;
}

function updateLeagueBadge() {
    const league = getPlayerLeague(player.balance);
    const badge = $('#league-badge');
    if (badge) {
        badge.textContent = league.name;
        badge.className = 'league-badge ' + league.cssClass;
    }
}

// ============ ОТРИСОВКА ============
function renderMyGarage() {
    const c = $('#garage-cars');
    if (!player.garage?.length) {
        c.innerHTML = '<p style="text-align:center;color:#aaa;">Гараж пуст.</p>';
        return;
    }
    c.innerHTML = player.garage.map((car, i) => {
        const t = CAR_TEMPLATES.find(x => x.id === car.templateId);
        if (!t) return '';
        return `
            <div class="car-card">
                <div class="car-info">
                    <h4>${t.emoji} ${t.name}</h4>
                    <p>Ур.${car.level} | Доход: +${t.income * car.level}</p>
                    <p>Перепродаж: ${car.timesResold}</p>
                    <p style="color:#4ecca3;">След.цена: ${Math.floor(car.buyPrice * 1.2)} 💰</p>
                </div>
                <div class="car-actions">
                    <button onclick="upgradeCar(${i})">🔧 (${Math.floor(car.buyPrice * 0.3 * car.level)} 💰)</button>
                </div>
            </div>`;
    }).join('');
}

function renderMarket() {
    const c = $('#market-list');
    const myLeague = getPlayerLeague(player.balance);
    
    const sameLeague = Object.values(allPlayers).filter(p => {
        if (p.id == userId) return false;
        if (!p.garage?.length) return false;
        const pLeague = getPlayerLeague(p.balance);
        return pLeague.name === myLeague.name;
    });
    
    if (!sameLeague.length) {
        c.innerHTML = '<p style="text-align:center;color:#aaa;">В твоей лиге пока никого нет.</p>';
        return;
    }
    
    c.innerHTML = sameLeague.map(p => `
        <div class="player-card" onclick="showPlayerGarage('${p.id}')">
            <div class="player-card-info">
                <h4>👤 ${p.name || 'Игрок'}</h4>
                <p>Машин: ${p.garage.length} | ${p.garage.reduce((s,x) => s + x.buyPrice, 0)} 💰</p>
                <span class="league-tag ${getPlayerLeague(p.balance).cssClass}">${getPlayerLeague(p.balance).name}</span>
            </div>
            <div class="player-card-arrow">➡️</div>
        </div>`).join('');
}

function renderPlayerGarage(pid) {
    const other = allPlayers[pid];
    if (!other) return hidePlayerGarage();
    $('#player-garage-title').textContent = `Гараж: ${other.name || 'Игрок'}`;
    const c = $('#player-garage-cars');
    if (!other.garage?.length) {
        c.innerHTML = '<p style="text-align:center;color:#aaa;">Пусто.</p>';
        return;
    }
    c.innerHTML = other.garage.map((car, i) => {
        const t = CAR_TEMPLATES.find(x => x.id === car.templateId);
        if (!t) return '';
        return `
            <div class="car-card">
                <div class="car-info">
                    <h4>${t.emoji} ${t.name}</h4>
                    <p>Ур.${car.level} | Доход: +${t.income * car.level}</p>
                    <p>Перепродаж: ${car.timesResold}</p>
                </div>
                <div class="car-actions">
                    <span class="car-price">${Math.floor(car.buyPrice * 1.2)} 💰</span>
                    <button onclick="buyCar('${pid}', ${i}, ${Math.floor(car.buyPrice * 1.2)})">Купить</button>
                </div>
            </div>`;
    }).join('');
}

function renderFriends() {
    const c = $('#friends-list');
    if (!player.friends?.length) {
        c.innerHTML = '<p style="text-align:center;color:#aaa;">Нет друзей. Приглашай!</p>';
        return;
    }
    c.innerHTML = player.friends.map(fid => {
        const f = allPlayers[fid];
        if (!f) return '';
        return `
            <div class="friend-card" onclick="showPlayerGarage('${f.id}')">
                <div class="friend-card-info">
                    <h4>👤 ${f.name || 'Игрок'}</h4>
                    <p>Баланс: ${f.balance} 💰 | Машин: ${f.garage?.length || 0}</p>
                    <span class="league-tag ${getPlayerLeague(f.balance).cssClass}">${getPlayerLeague(f.balance).name}</span>
                </div>
                <div class="player-card-arrow">➡️</div>
            </div>`;
    }).join('');
}

function renderRating() {
    const c = $('#rating-list');
    const all = Object.values(allPlayers).sort((a,b) => b.balance - a.balance);
    if (!all.length) {
        c.innerHTML = '<p style="text-align:center;color:#aaa;">Пусто.</p>';
        return;
    }
    c.innerHTML = all.map((p, i) => {
        let topClass = '';
        let medal = '';
        if (i === 0) { topClass = 'top-1'; medal = '🥇'; }
        else if (i === 1) { topClass = 'top-2'; medal = '🥈'; }
        else if (i === 2) { topClass = 'top-3'; medal = '🥉'; }
        
        return `
            <div class="rating-card ${topClass}">
                <div class="rating-pos">${medal || (i+1)}</div>
                <div class="rating-card-info">
                    <h4>${p.name || 'Игрок'}</h4>
                    <p>${p.balance} 💰 | Машин: ${p.garage?.length || 0}</p>
                    <span class="league-tag ${getPlayerLeague(p.balance).cssClass}">${getPlayerLeague(p.balance).name}</span>
                </div>
            </div>`;
    }).join('');
}

// ============ ДЕЙСТВИЯ ============
async function buyCar(sellerId, carIndex, price) {
    if (player.balance < price) return tg.showAlert('Мало монет!');
    const seller = allPlayers[sellerId];
    if (!seller?.garage?.[carIndex]) return tg.showAlert('Продано!');
    
    const car = seller.garage.splice(carIndex, 1)[0];
    const commission = Math.floor(price * 0.1);
    
    player.balance -= price;
    seller.balance += price - commission;
    
    car.ownerHistory.push(sellerId);
    car.timesResold++;
    car.buyPrice = price;
    car.level++;
    
    player.garage.push(car);
    
    await saveAllData();
    updateUI();
    renderPlayerGarage(sellerId);
    tg.showAlert(`Куплено! Комиссия: ${commission} 💰`);
}

async function upgradeCar(index) {
    const car = player.garage[index];
    if (!car) return;
    const cost = Math.floor(car.buyPrice * 0.3 * car.level);
    if (player.balance < cost) return tg.showAlert('Мало монет!');
    
    player.balance -= cost;
    car.level++;
    car.buyPrice = Math.floor(car.buyPrice * 1.1);
    
    await saveAllData();
    updateUI();
    renderMyGarage();
    tg.showAlert(`Тюнинг! Ур.${car.level}`);
}

async function doFarm() {
    const now = Date.now();
    const cooldown = 60000;
    if (now - player.last_farm < cooldown) {
        const sec = Math.ceil((cooldown - (now - player.last_farm)) / 1000);
        return tg.showAlert(`Жди ${sec} сек.`);
    }
    let income = 0;
    player.garage.forEach(car => {
        const t = CAR_TEMPLATES.find(x => x.id === car.templateId);
        if (t) income += t.income * car.level;
    });
    player.balance += income;
    player.last_farm = now;
    
    await saveAllData();
    $('#farm-result').textContent = `+${income} 💰`;
    updateUI();
    checkFarmCooldown();
}

function checkFarmCooldown() {
    const btn = $('#farm-button');
    if (btn) btn.style.opacity = (Date.now() - player.last_farm < 60000) ? '0.5' : '1';
}

// ============ РЕФЕРАЛЬНАЯ СИСТЕМА ============
const urlParams = new URLSearchParams(window.location.search);
const refId = urlParams.get('start');

if (refId && refId != userId) {
    if (!player.ref_by) {
        player.ref_by = refId;
    }
}

async function processReferral() {
    if (!player.ref_by || player.ref_by == userId) return;
    
    const inviter = allPlayers[player.ref_by];
    if (inviter) {
        inviter.friends = inviter.friends || [];
        if (!inviter.friends.includes(userId)) {
            inviter.friends.push(userId);
            inviter.ref_count = (inviter.ref_count || 0) + 1;
            inviter.balance += 100;
            player.balance += 50;
            await saveAllData();
        }
    }
}

// ============ ИНИЦИАЛИЗАЦИЯ ============
function initPlayer() {
    player.ref_link = `https://t.me/perekup_bot?start=${userId}`;
    player.ref_count = 0;
    player.friends = [];
    player.balance = 500;
    player.garage = [{
        uniqueId: 'car_' + Date.now() + '_' + userId,
        templateId: 1,
        level: 1,
        ownerHistory: [userId],
        buyPrice: 50,
        timesResold: 0
    }];
    allPlayers[userId] = player;
    saveAllData();
    updateUI();
}

// ============ СТАРТ ============
(async function start() {
    if (!userId) return tg.showAlert('Запусти через Telegram!');
    await loadAllData();
    await processReferral();
    setInterval(checkFarmCooldown, 1000);
})();

// Токен теперь в config.js
var GITHUB_TOKEN = '{{env.GITHUB_TOKEN}}';
var GITHUB_USER = 'ТВОЙ_ЛОГИН_GITHUB';
var GITHUB_REPO = 'perekup-game';
var DATA_FILE = 'data.json';

// ============ TELEGRAM ============
var tg = window.Telegram.WebApp;
tg.expand();

var userId = tg.initDataUnsafe?.user?.id;
var userName = tg.initDataUnsafe?.user?.first_name || 'Игрок';

if (!userId) {
    alert('Открой через Telegram!');
}

// ============ МАШИНЫ ============
var CAR_TEMPLATES = [
    { id: 1, name: 'Ржавый Запорожец', basePrice: 50, income: 1, emoji: '🚗' },
    { id: 2, name: 'Ушатанная Девятка', basePrice: 100, income: 2, emoji: '🚙' },
    { id: 3, name: 'Лада Приора', basePrice: 200, income: 4, emoji: '🏎️' },
    { id: 4, name: 'Toyota Camry', basePrice: 400, income: 8, emoji: '🚘' },
    { id: 5, name: 'BMW 3 (битая)', basePrice: 800, income: 15, emoji: '🚙' },
    { id: 6, name: 'Porsche Cayenne', basePrice: 1500, income: 25, emoji: '🏎️' },
    { id: 7, name: 'Geländewagen', basePrice: 3000, income: 50, emoji: '🚛' },
    { id: 8, name: 'Lamborghini', basePrice: 6000, income: 100, emoji: '🏎️' },
    { id: 9, name: 'Bugatti', basePrice: 12000, income: 200, emoji: '🏎️' },
    { id: 10, name: 'Золотая Tesla', basePrice: 25000, income: 500, emoji: '⚡' }
];

// ============ ЛИГИ ============
var LEAGUES = [
    { name: '🔰 Новичок', minBalance: 0, maxBalance: 999, cssClass: 'league-novice' },
    { name: '🥉 Бронза', minBalance: 1000, maxBalance: 4999, cssClass: 'league-bronze' },
    { name: '🥈 Серебро', minBalance: 5000, maxBalance: 19999, cssClass: 'league-silver' },
    { name: '🥇 Золото', minBalance: 20000, maxBalance: 99999, cssClass: 'league-gold' },
    { name: '💎 Платина', minBalance: 100000, maxBalance: 499999, cssClass: 'league-platinum' },
    { name: '👑 Алмаз', minBalance: 500000, maxBalance: 999999999, cssClass: 'league-diamond' }
];

function getLeague(balance) {
    for (var i = 0; i < LEAGUES.length; i++) {
        if (balance >= LEAGUES[i].minBalance && balance <= LEAGUES[i].maxBalance) return LEAGUES[i];
    }
    return LEAGUES[0];
}

// ============ ИГРОК ============
var player = {
    id: userId,
    name: userName,
    balance: 500,
    garage: [],
    ref_link: 'https://t.me/perekup_bot?start=' + userId,
    ref_count: 0,
    friends: [],
    last_farm: 0
};

var allPlayers = {};

// ============ GITHUB API ============
var API_URL = 'https://api.github.com/repos/' + GITHUB_USER + '/' + GITHUB_REPO + '/contents/' + DATA_FILE;

function loadAllData(callback) {
    fetch(API_URL, {
        headers: { 'Authorization': 'token ' + GITHUB_TOKEN }
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
        var content = atob(data.content);
        allPlayers = JSON.parse(content) || {};
        if (allPlayers[userId]) {
            player = allPlayers[userId];
            player.id = userId;
            player.name = player.name || userName;
            player.friends = player.friends || [];
            player.garage = player.garage || [];
            if (!player.garage || player.garage.length === 0) {
                addStarterCar();
            }
        } else {
            addStarterCar();
        }
        if (callback) callback();
    })
    .catch(function(e) {
        console.log('Ошибка загрузки:', e);
        addStarterCar();
        if (callback) callback();
    });
}

function saveAllData() {
    allPlayers[userId] = player;
    fetch(API_URL, {
        headers: { 'Authorization': 'token ' + GITHUB_TOKEN }
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
        var body = {
            message: 'update game data',
            content: btoa(unescape(encodeURIComponent(JSON.stringify(allPlayers))))
        };
        if (data.sha) body.sha = data.sha;
        return fetch(API_URL, {
            method: 'PUT',
            headers: {
                'Authorization': 'token ' + GITHUB_TOKEN,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
    })
    .catch(function(e) {
        console.log('Ошибка сохранения:', e);
    });
}

function addStarterCar() {
    if (!player.garage) player.garage = [];
    player.garage.push({
        uniqueId: 'car_' + Date.now() + '_' + userId,
        templateId: 1,
        level: 1,
        ownerHistory: [userId],
        buyPrice: 50,
        timesResold: 0
    });
    allPlayers[userId] = player;
    saveAllData();
}

// ============ ФУНКЦИИ ОТОБРАЖЕНИЯ ============
function $(id) { return document.getElementById(id); }

function hideAll() {
    var screens = ['garage-screen','market-screen','player-garage-screen','invite-screen','friends-screen','rating-screen','farm-screen'];
    for (var i = 0; i < screens.length; i++) {
        var el = $(screens[i]);
        if (el) el.classList.add('hidden');
    }
}

function showGarage() { hideAll(); $('garage-screen').classList.remove('hidden'); renderGarage(); }
function hideGarage() { $('garage-screen').classList.add('hidden'); }

function showMarket() { hideAll(); $('market-screen').classList.remove('hidden'); renderMarket(); }
function hideMarket() { $('market-screen').classList.add('hidden'); }

function showPlayerGarage(pid) { hideAll(); $('player-garage-screen').classList.remove('hidden'); renderPlayerGarage(pid); }
function hidePlayerGarage() { $('player-garage-screen').classList.add('hidden'); }

function showInvite() {
    hideAll();
    $('invite-screen').classList.remove('hidden');
    $('ref-link').textContent = player.ref_link;
    $('ref-count').textContent = player.ref_count;
}
function hideInvite() { $('invite-screen').classList.add('hidden'); }

function showFriends() { hideAll(); $('friends-screen').classList.remove('hidden'); renderFriends(); }
function hideFriends() { $('friends-screen').classList.add('hidden'); }

function showRating() { hideAll(); $('rating-screen').classList.remove('hidden'); renderRating(); }
function hideRating() { $('rating-screen').classList.add('hidden'); }

function showFarm() { hideAll(); $('farm-screen').classList.remove('hidden'); updateFarmButton(); }
function hideFarm() { $('farm-screen').classList.add('hidden'); }

function inviteToChat() {
    tg.openTelegramLink('https://t.me/+ВАША_ССЫЛКА_НА_ЧАТ');
}

// ============ ОТРИСОВКА ============
function updateUI() {
    $('balance').textContent = player.balance;
    var league = getLeague(player.balance);
    var badge = $('league-badge');
    if (badge) {
        badge.textContent = league.name;
        badge.className = 'league-badge ' + league.cssClass;
    }
}

function findTemplate(id) {
    for (var i = 0; i < CAR_TEMPLATES.length; i++) {
        if (CAR_TEMPLATES[i].id === id) return CAR_TEMPLATES[i];
    }
    return null;
}

function renderGarage() {
    var c = $('garage-cars');
    if (!player.garage || player.garage.length === 0) {
        c.innerHTML = '<p style="text-align:center;color:#aaa;">Гараж пуст.</p>';
        return;
    }
    var html = '';
    for (var i = 0; i < player.garage.length; i++) {
        var car = player.garage[i];
        var t = findTemplate(car.templateId);
        if (!t) continue;
        html += '<div class="car-card"><div class="car-info"><h4>' + t.emoji + ' ' + t.name + '</h4><p>Ур.' + car.level + ' | Доход: +' + (t.income * car.level) + '</p><p>Перепродаж: ' + car.timesResold + '</p><p style="color:#4ecca3;">След.цена: ' + Math.floor(car.buyPrice * 1.2) + ' 💰</p></div><div class="car-actions"><button onclick="upgradeCar(' + i + ')">🔧 (' + Math.floor(car.buyPrice * 0.3 * car.level) + ' 💰)</button></div></div>';
    }
    c.innerHTML = html;
}

function renderMarket() {
    var c = $('market-list');
    var myLeague = getLeague(player.balance);
    var sameLeague = [];
    for (var id in allPlayers) {
        var p = allPlayers[id];
        if (p.id == player.id) continue;
        if (!p.garage || p.garage.length === 0) continue;
        if (getLeague(p.balance).name === myLeague.name) sameLeague.push(p);
    }
    if (sameLeague.length === 0) {
        c.innerHTML = '<p style="text-align:center;color:#aaa;">В твоей лиге никого нет.</p>';
        return;
    }
    var html = '';
    for (var i = 0; i < sameLeague.length; i++) {
        var p = sameLeague[i];
        var val = 0;
        for (var j = 0; j < p.garage.length; j++) val += p.garage[j].buyPrice;
        html += '<div class="player-card" onclick="showPlayerGarage(\'' + p.id + '\')"><div class="player-card-info"><h4>👤 ' + (p.name || 'Игрок') + '</h4><p>Машин: ' + p.garage.length + ' | ' + val + ' 💰</p><span class="league-tag ' + getLeague(p.balance).cssClass + '">' + getLeague(p.balance).name + '</span></div><div class="player-card-arrow">➡️</div></div>';
    }
    c.innerHTML = html;
}

function renderPlayerGarage(pid) {
    var other = allPlayers[pid];
    if (!other) { hidePlayerGarage(); return; }
    $('player-garage-title').textContent = 'Гараж: ' + (other.name || 'Игрок');
    var c = $('player-garage-cars');
    if (!other.garage || other.garage.length === 0) {
        c.innerHTML = '<p style="text-align:center;color:#aaa;">Пусто.</p>';
        return;
    }
    var html = '';
    for (var i = 0; i < other.garage.length; i++) {
        var car = other.garage[i];
        var t = findTemplate(car.templateId);
        if (!t) continue;
        var price = Math.floor(car.buyPrice * 1.2);
        html += '<div class="car-card"><div class="car-info"><h4>' + t.emoji + ' ' + t.name + '</h4><p>Ур.' + car.level + ' | Доход: +' + (t.income * car.level) + '</p><p>Перепродаж: ' + car.timesResold + '</p></div><div class="car-actions"><span class="car-price">' + price + ' 💰</span><button onclick="buyCar(\'' + pid + '\', ' + i + ', ' + price + ')">Купить</button></div></div>';
    }
    c.innerHTML = html;
}

function renderFriends() {
    var c = $('friends-list');
    if (!player.friends || player.friends.length === 0) {
        c.innerHTML = '<p style="text-align:center;color:#aaa;">Нет друзей.</p>';
        return;
    }
    var html = '';
    for (var i = 0; i < player.friends.length; i++) {
        var f = allPlayers[player.friends[i]];
        if (!f) continue;
        html += '<div class="friend-card" onclick="showPlayerGarage(\'' + f.id + '\')"><div class="friend-card-info"><h4>👤 ' + (f.name || 'Игрок') + '</h4><p>Баланс: ' + f.balance + ' 💰 | Машин: ' + (f.garage ? f.garage.length : 0) + '</p></div><div class="player-card-arrow">➡️</div></div>';
    }
    c.innerHTML = html;
}

function renderRating() {
    var c = $('rating-list');
    var all = [];
    for (var id in allPlayers) all.push(allPlayers[id]);
    all.sort(function(a, b) { return b.balance - a.balance; });
    var html = '';
    for (var i = 0; i < all.length; i++) {
        var p = all[i];
        var medal = '';
        if (i === 0) medal = '🥇';
        else if (i === 1) medal = '🥈';
        else if (i === 2) medal = '🥉';
        html += '<div class="rating-card"><div class="rating-pos">' + (medal || (i + 1)) + '</div><div class="rating-card-info"><h4>' + (p.name || 'Игрок') + '</h4><p>' + p.balance + ' 💰 | Машин: ' + (p.garage ? p.garage.length : 0) + '</p></div></div>';
    }
    c.innerHTML = html || '<p style="text-align:center;color:#aaa;">Пусто.</p>';
}

// ============ ТАЙМЕР ФАРМА ============
function updateFarmButton() {
    var btn = $('farm-button');
    if (!btn) return;
    var diff = Date.now() - player.last_farm;
    if (diff < 10000) {
        var sec = Math.ceil((10000 - diff) / 1000);
        btn.textContent = '⏳ Остывает ' + sec + ' сек';
        btn.style.opacity = '0.5';
        if ($('farm-result')) $('farm-result').textContent = '';
    } else {
        btn.textContent = '⚡ Газануть!';
        btn.style.opacity = '1';
    }
}

// ============ ИГРОВЫЕ ДЕЙСТВИЯ ============
function buyCar(sellerId, carIndex, price) {
    if (player.balance < price) return tg.showAlert('Мало монет!');
    var seller = allPlayers[sellerId];
    if (!seller || !seller.garage || !seller.garage[carIndex]) return tg.showAlert('Продано!');
    var car = seller.garage.splice(carIndex, 1)[0];
    var commission = Math.floor(price * 0.1);
    player.balance -= price;
    seller.balance += price - commission;
    car.ownerHistory.push(sellerId);
    car.timesResold++;
    car.buyPrice = price;
    car.level++;
    player.garage.push(car);
    saveAllData();
    updateUI();
    renderPlayerGarage(sellerId);
    tg.showAlert('Куплено! Комиссия: ' + commission + ' 💰');
}

function upgradeCar(index) {
    var car = player.garage[index];
    if (!car) return;
    var cost = Math.floor(car.buyPrice * 0.3 * car.level);
    if (player.balance < cost) return tg.showAlert('Мало монет!');
    player.balance -= cost;
    car.level++;
    car.buyPrice = Math.floor(car.buyPrice * 1.1);
    saveAllData();
    updateUI();
    renderGarage();
    tg.showAlert('Тюнинг! Ур.' + car.level);
}

function doFarm() {
    var now = Date.now();
    if (now - player.last_farm < 10000) {
        var sec = Math.ceil((10000 - (now - player.last_farm)) / 1000);
        return tg.showAlert('Жди ' + sec + ' сек.');
    }
    var income = 0;
    for (var i = 0; i < player.garage.length; i++) {
        var t = findTemplate(player.garage[i].templateId);
        if (t) income += t.income * player.garage[i].level;
    }
    player.balance += income;
    player.last_farm = now;
    saveAllData();
    updateUI();
    updateFarmButton();
    if ($('farm-result')) $('farm-result').textContent = '+' + income + ' 💰';
    tg.showAlert('+' + income + ' 💰');
}

// ============ РЕФЕРАЛЫ ============
var urlParams = new URLSearchParams(window.location.search);
var refId = urlParams.get('start');

function processReferral() {
    if (!refId || refId == userId) return;
    var inviter = allPlayers[refId];
    if (!inviter) return;
    inviter.friends = inviter.friends || [];
    var found = false;
    for (var i = 0; i < inviter.friends.length; i++) {
        if (inviter.friends[i] === userId) { found = true; break; }
    }
    if (!found) {
        inviter.friends.push(userId);
        inviter.ref_count = (inviter.ref_count || 0) + 1;
        inviter.balance += 100;
        player.balance += 50;
        saveAllData();
    }
}

// ============ СТАРТ ============
loadAllData(function() {
    processReferral();
    updateUI();
    updateFarmButton();
    setInterval(updateFarmButton, 1000);
});

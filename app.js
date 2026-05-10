// Telegram Web App
var tg = window.Telegram.WebApp;
tg.expand();

var userId = tg.initDataUnsafe?.user?.id || 'test_' + Date.now();
var userName = tg.initDataUnsafe?.user?.first_name || 'Игрок';

// Машины
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

// Лиги
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
        if (balance >= LEAGUES[i].minBalance && balance <= LEAGUES[i].maxBalance) {
            return LEAGUES[i];
        }
    }
    return LEAGUES[0];
}

// Игрок
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

// Стартовая машина
player.garage.push({
    uniqueId: 'car_' + Date.now(),
    templateId: 1,
    level: 1,
    ownerHistory: [userId],
    buyPrice: 50,
    timesResold: 0
});

// Сохраняем
localStorage.setItem('player_' + userId, JSON.stringify(player));

// ============ ФУНКЦИИ ============
function $(id) {
    return document.getElementById(id);
}

function hideAll() {
    var screens = ['garage-screen', 'market-screen', 'player-garage-screen', 'invite-screen', 'friends-screen', 'rating-screen', 'farm-screen'];
    for (var i = 0; i < screens.length; i++) {
        var el = $(screens[i]);
        if (el) el.classList.add('hidden');
    }
}

function showGarage() {
    hideAll();
    $('garage-screen').classList.remove('hidden');
    var c = $('garage-cars');
    var html = '';
    for (var i = 0; i < player.garage.length; i++) {
        var car = player.garage[i];
        var t = null;
        for (var j = 0; j < CAR_TEMPLATES.length; j++) {
            if (CAR_TEMPLATES[j].id === car.templateId) { t = CAR_TEMPLATES[j]; break; }
        }
        if (!t) continue;
        html += '<div class="car-card"><div class="car-info"><h4>' + t.emoji + ' ' + t.name + '</h4><p>Ур.' + car.level + ' | Доход: +' + (t.income * car.level) + '</p><p>Перепродаж: ' + car.timesResold + '</p><p style="color:#4ecca3;">След.цена: ' + Math.floor(car.buyPrice * 1.2) + ' 💰</p></div><div class="car-actions"><button onclick="upgradeCar(' + i + ')">🔧 (' + Math.floor(car.buyPrice * 0.3 * car.level) + ' 💰)</button></div></div>';
    }
    c.innerHTML = html || '<p style="text-align:center;color:#aaa;">Гараж пуст.</p>';
}

function hideGarage() { $('garage-screen').classList.add('hidden'); }

function showMarket() {
    hideAll();
    $('market-screen').classList.remove('hidden');
    $('market-list').innerHTML = '<p style="text-align:center;color:#aaa;">Пригласи друзей, чтобы они появились здесь!</p>';
}

function hideMarket() { $('market-screen').classList.add('hidden'); }

function showPlayerGarage() {
    hideAll();
    $('player-garage-screen').classList.remove('hidden');
    $('player-garage-cars').innerHTML = '<p style="text-align:center;color:#aaa;">Пусто.</p>';
}

function hidePlayerGarage() { $('player-garage-screen').classList.add('hidden'); }

function showInvite() {
    hideAll();
    $('invite-screen').classList.remove('hidden');
    $('ref-link').textContent = player.ref_link;
    $('ref-count').textContent = player.ref_count;
}

function hideInvite() { $('invite-screen').classList.add('hidden'); }

function showFriends() {
    hideAll();
    $('friends-screen').classList.remove('hidden');
    $('friends-list').innerHTML = '<p style="text-align:center;color:#aaa;">Пока нет друзей. Пригласи!</p>';
}

function hideFriends() { $('friends-screen').classList.add('hidden'); }

function showRating() {
    hideAll();
    $('rating-screen').classList.remove('hidden');
    $('rating-list').innerHTML = '<div class="rating-card"><div class="rating-pos">🥇</div><div class="rating-card-info"><h4>' + player.name + '</h4><p>' + player.balance + ' 💰 | Машин: ' + player.garage.length + '</p></div></div>';
}

function hideRating() { $('rating-screen').classList.add('hidden'); }

function showFarm() {
    hideAll();
    $('farm-screen').classList.remove('hidden');
    $('farm-result').textContent = '';
}

function hideFarm() { $('farm-screen').classList.add('hidden'); }

function upgradeCar(index) {
    var car = player.garage[index];
    if (!car) return;
    var t = null;
    for (var j = 0; j < CAR_TEMPLATES.length; j++) {
        if (CAR_TEMPLATES[j].id === car.templateId) { t = CAR_TEMPLATES[j]; break; }
    }
    var cost = Math.floor(car.buyPrice * 0.3 * car.level);
    if (player.balance < cost) {
        return tg.showAlert('Мало монет!');
    }
    player.balance -= cost;
    car.level++;
    car.buyPrice = Math.floor(car.buyPrice * 1.1);
    localStorage.setItem('player_' + userId, JSON.stringify(player));
    $('balance').textContent = player.balance;
    showGarage();
    tg.showAlert('Тюнинг! Ур.' + car.level);
}

function doFarm() {
    var now = Date.now();
    if (now - player.last_farm < 60000) {
        var sec = Math.ceil((60000 - (now - player.last_farm)) / 1000);
        return tg.showAlert('Жди ' + sec + ' сек.');
    }
    var income = 0;
    for (var i = 0; i < player.garage.length; i++) {
        var car = player.garage[i];
        var t = null;
        for (var j = 0; j < CAR_TEMPLATES.length; j++) {
            if (CAR_TEMPLATES[j].id === car.templateId) { t = CAR_TEMPLATES[j]; break; }
        }
        if (t) income += t.income * car.level;
    }
    player.balance += income;
    player.last_farm = now;
    localStorage.setItem('player_' + userId, JSON.stringify(player));
    $('balance').textContent = player.balance;
    $('farm-result').textContent = '+' + income + ' 💰';
    var league = getLeague(player.balance);
    $('league-badge').textContent = league.name;
    $('league-badge').className = 'league-badge ' + league.cssClass;
    tg.showAlert('+' + income + ' 💰');
}

// Обновляем баланс при старте
$('balance').textContent = player.balance;
var startLeague = getLeague(player.balance);
$('league-badge').textContent = startLeague.name;
$('league-badge').className = 'league-badge ' + startLeague.cssClass;

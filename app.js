// Подключаем Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand();

// ID игрока (Telegram user id)
const userId = tg.initDataUnsafe?.user?.id;

// Игровые данные
let player = {
    id: userId,
    balance: 100,
    cars: [],
    ref_link: '',
    ref_count: 0,
    last_farm: 0
};

// Машины (имитация базы данных в памяти)
const CARS = [
    { id: 1, name: 'Ржавый Запорожец', price: 50, income: 1 },
    { id: 2, name: 'Ушатанная Девятка', price: 100, income: 2 },
    { id: 3, name: 'Лада Приора', price: 200, income: 4 },
    { id: 4, name: 'Toyota Camry', price: 400, income: 8 },
    { id: 5, name: 'BMW 3 (битая)', price: 800, income: 15 },
    { id: 6, name: 'Porsche Cayenne', price: 1500, income: 25 },
    { id: 7, name: 'Geländewagen', price: 3000, income: 50 },
    { id: 8, name: 'Lamborghini', price: 6000, income: 100 },
    { id: 9, name: 'Bugatti', price: 12000, income: 200 },
    { id: 10, name: 'Золотая Tesla', price: 25000, income: 500 }
];

// Рынок (все игроки и их машины)
let allPlayers = {};

// ============ ФУНКЦИИ ОТОБРАЖЕНИЯ ============

function updateBalanceDisplay() {
    document.getElementById('balance').textContent = player.balance;
}

function showGarage() {
    document.getElementById('garage-screen').classList.remove('hidden');
    renderGarage();
}

function hideGarage() {
    document.getElementById('garage-screen').classList.add('hidden');
}

function renderGarage() {
    const container = document.getElementById('garage-cars');
    if (player.cars.length === 0) {
        container.innerHTML = '<p>У тебя пока нет машин. Купи на рынке!</p>';
        return;
    }
    container.innerHTML = player.cars.map((car, index) => {
        const carData = CARS.find(c => c.id === car.carId);
        return `
            <div class="car-card">
                <div class="car-info">
                    <h4>${carData.name}</h4>
                    <p>Уровень: ${car.level} | Доход: +${carData.income * car.level} за тык</p>
                </div>
                <div class="car-actions">
                    <button onclick="upgradeCar(${index})">🔧 Тюнинг (${carData.price * car.level * 0.5} 💰)</button>
                </div>
            </div>
        `;
    }).join('');
}

function showMarket() {
    document.getElementById('market-screen').classList.remove('hidden');
    renderMarket();
}

function hideMarket() {
    document.getElementById('market-screen').classList.add('hidden');
}

function renderMarket() {
    const container = document.getElementById('market-list');
    let html = '';
    
    for (let otherId in allPlayers) {
        if (otherId == userId) continue;
        const otherPlayer = allPlayers[otherId];
        if (!otherPlayer.cars || otherPlayer.cars.length === 0) continue;
        
        otherPlayer.cars.forEach((car, index) => {
            const carData = CARS.find(c => c.id === car.carId);
            const buyPrice = Math.floor(carData.price * car.level * 1.2); // Цена растет
            html += `
                <div class="car-card">
                    <div class="car-info">
                        <h4>${carData.name} (Ур.${car.level})</h4>
                        <p>Владелец: ID ${otherId}</p>
                        <p>Доход: +${carData.income * car.level}</p>
                    </div>
                    <div class="car-actions">
                        <span class="car-price">${buyPrice} 💰</span>
                        <button onclick="buyCar('${otherId}', ${index}, ${buyPrice})">Купить</button>
                    </div>
                </div>
            `;
        });
    }
    
    container.innerHTML = html || '<p>На рынке пока пусто. Пригласи друзей!</p>';
}

function showInvite() {
    document.getElementById('invite-screen').classList.remove('hidden');
    document.getElementById('ref-link').textContent = player.ref_link;
    document.getElementById('ref-count').textContent = player.ref_count;
}

function hideInvite() {
    document.getElementById('invite-screen').classList.add('hidden');
}

function showFarm() {
    document.getElementById('farm-screen').classList.remove('hidden');
    checkFarmCooldown();
}

function hideFarm() {
    document.getElementById('farm-screen').classList.add('hidden');
}

// ============ ИГРОВАЯ ЛОГИКА ============

function buyCar(sellerId, carIndex, price) {
    if (player.balance < price) {
        tg.showAlert('Недостаточно монет!');
        return;
    }
    
    const seller = allPlayers[sellerId];
    if (!seller || !seller.cars[carIndex]) {
        tg.showAlert('Машина уже продана!');
        return;
    }
    
    // Списываем деньги
    player.balance -= price;
    seller.balance += price;
    
    // Передаём машину
    const boughtCar = seller.cars.splice(carIndex, 1)[0];
    boughtCar.level += 1; // При перекупе уровень растёт
    player.cars.push(boughtCar);
    
    updateBalanceDisplay();
    renderMarket();
    tg.showAlert('Машина куплена! Теперь она в твоём гараже.');
}

function upgradeCar(index) {
    const car = player.cars[index];
    const carData = CARS.find(c => c.id === car.carId);
    const cost = Math.floor(carData.price * car.level * 0.5);
    
    if (player.balance < cost) {
        tg.showAlert('Недостаточно монет для тюнинга!');
        return;
    }
    
    player.balance -= cost;
    car.level += 1;
    
    updateBalanceDisplay();
    renderGarage();
    tg.showAlert(`Тюнинг выполнен! Уровень повышен до ${car.level}`);
}

function doFarm() {
    const now = Date.now();
    if (now - player.last_farm < 3600000) { // 1 час
        const mins = Math.ceil((3600000 - (now - player.last_farm)) / 60000);
        tg.showAlert(`Двигатели остывают! Приходи через ${mins} мин.`);
        return;
    }
    
    // Считаем доход со всех машин
    let totalIncome = 0;
    player.cars.forEach(car => {
        const carData = CARS.find(c => c.id === car.carId);
        totalIncome += carData.income * car.level;
    });
    
    player.balance += totalIncome;
    player.last_farm = now;
    
    document.getElementById('farm-result').textContent = 
        `Ты крутанул движки и срубил +${totalIncome} 💰!`;
    
    updateBalanceDisplay();
    checkFarmCooldown();
}

function checkFarmCooldown() {
    const now = Date.now();
    const button = document.getElementById('farm-button');
    if (now - player.last_farm < 3600000) {
        button.style.opacity = '0.5';
    } else {
        button.style.opacity = '1';
    }
}

// ============ ИНИЦИАЛИЗАЦИЯ ============

function initPlayer() {
    // Генерируем реферальную ссылку
    player.ref_link = `https://t.me/perekup_bot?start=${userId}`;
    player.ref_count = 0;
    
    // Даём стартовую машину
    player.cars.push({ carId: 1, level: 1 }); // Запорожец
    
    updateBalanceDisplay();
}

// Запуск
if (userId) {
    // Загружаем данные (в реальности — из Google Таблиц)
    // Пока используем локальное хранилище
    const saved = localStorage.getItem(`player_${userId}`);
    if (saved) {
        player = JSON.parse(saved);
    } else {
        initPlayer();
    }
    
    // Сохраняем игрока в общий список
    allPlayers[userId] = player;
    
    updateBalanceDisplay();
} else {
    tg.showAlert('Ошибка: не удалось получить ID пользователя.');
}

// Сохраняем перед закрытием
window.addEventListener('beforeunload', () => {
    localStorage.setItem(`player_${userId}`, JSON.stringify(player));
});

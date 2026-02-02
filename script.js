const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const restartButton = document.getElementById("restart");
const evolutionName = document.getElementById("evolutionName");
const evolutionLevel = document.getElementById("evolutionLevel");
const statPower = document.getElementById("statPower");
const statSpeed = document.getElementById("statSpeed");
const statHealth = document.getElementById("statHealth");
const statKills = document.getElementById("statKills");
const statProgress = document.getElementById("statProgress");
const evolutionList = document.getElementById("evolutionList");

const evolutions = [
  { name: "Микроорганизм", power: 4, speed: 1.9, maxHealth: 40, required: 2 },
  { name: "Одноклеточный охотник", power: 6, speed: 2.2, maxHealth: 50, required: 3 },
  { name: "Колония спор", power: 7, speed: 2.4, maxHealth: 60, required: 3 },
  { name: "Планктонный рой", power: 8, speed: 2.5, maxHealth: 70, required: 4 },
  { name: "Быстрый мальок", power: 10, speed: 2.8, maxHealth: 80, required: 4 },
  { name: "Хищная рыба", power: 12, speed: 3.1, maxHealth: 95, required: 5 },
  { name: "Древний амфибий", power: 14, speed: 3.3, maxHealth: 110, required: 5 },
  { name: "Ловкий рептилий", power: 16, speed: 3.6, maxHealth: 125, required: 6 },
  { name: "Саблезуб", power: 18, speed: 3.8, maxHealth: 140, required: 6 },
  { name: "Стая охотников", power: 20, speed: 4.1, maxHealth: 155, required: 7 },
  { name: "Доминирующий хищник", power: 22, speed: 4.3, maxHealth: 170, required: 7 },
  { name: "Грозовой ящер", power: 25, speed: 4.6, maxHealth: 190, required: 8 },
  { name: "Кибер-зверь", power: 28, speed: 4.9, maxHealth: 215, required: 8 },
  { name: "Элитный мутант", power: 32, speed: 5.2, maxHealth: 245, required: 9 },
  { name: "Абсолютный вид", power: 36, speed: 5.6, maxHealth: 280, required: 10 },
];

const state = {
  level: 0,
  kills: 0,
  progress: 0,
  gameOver: false,
  message: "",
};

const player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 14,
  power: evolutions[0].power,
  speed: evolutions[0].speed,
  maxHealth: evolutions[0].maxHealth,
  health: evolutions[0].maxHealth,
  dashCooldown: 0,
  dashTimer: 0,
};

const enemyConfig = {
  count: 8,
  baseHealth: 20,
  basePower: 6,
  baseSpeed: 1.4,
};

let enemies = [];
const keys = new Set();

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const resetPlayer = () => {
  const evo = evolutions[state.level];
  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
  player.power = evo.power;
  player.speed = evo.speed;
  player.maxHealth = evo.maxHealth;
  player.health = evo.maxHealth;
  player.dashCooldown = 0;
  player.dashTimer = 0;
};

const spawnEnemy = () => {
  const edge = Math.floor(Math.random() * 4);
  const margin = 20;
  let x = margin;
  let y = margin;
  if (edge === 0) {
    x = Math.random() * canvas.width;
    y = margin;
  } else if (edge === 1) {
    x = canvas.width - margin;
    y = Math.random() * canvas.height;
  } else if (edge === 2) {
    x = Math.random() * canvas.width;
    y = canvas.height - margin;
  } else {
    x = margin;
    y = Math.random() * canvas.height;
  }

  const levelBoost = state.level * 0.15;
  return {
    id: crypto.randomUUID(),
    x,
    y,
    radius: 12 + Math.random() * 6,
    health: enemyConfig.baseHealth + state.level * 4,
    power: enemyConfig.basePower + levelBoost * 5,
    speed: enemyConfig.baseSpeed + levelBoost,
  };
};

const resetEnemies = () => {
  enemies = Array.from({ length: enemyConfig.count }, spawnEnemy);
};

const updateEvolutionUI = () => {
  const evo = evolutions[state.level];
  evolutionName.textContent = evo.name;
  evolutionLevel.textContent = `${state.level + 1} / ${evolutions.length}`;
  statPower.textContent = player.power.toFixed(0);
  statSpeed.textContent = player.speed.toFixed(1);
  statHealth.textContent = `${Math.max(0, Math.ceil(player.health))} / ${player.maxHealth}`;
  statKills.textContent = state.kills;
  statProgress.textContent = `${state.progress} / ${evo.required}`;

  Array.from(evolutionList.children).forEach((item, index) => {
    item.classList.toggle("active", index === state.level);
  });
};

const buildEvolutionList = () => {
  evolutionList.innerHTML = "";
  evolutions.forEach((evo, index) => {
    const item = document.createElement("li");
    const label = document.createElement("span");
    label.textContent = `${index + 1}.`;
    const name = document.createElement("div");
    name.textContent = evo.name;
    item.append(label, name);
    if (index === state.level) {
      item.classList.add("active");
    }
    evolutionList.append(item);
  });
};

const evolve = () => {
  if (state.level >= evolutions.length - 1) {
    return;
  }
  state.level += 1;
  state.progress = 0;
  const evo = evolutions[state.level];
  player.power = evo.power;
  player.speed = evo.speed;
  player.maxHealth = evo.maxHealth;
  player.health = player.maxHealth;
  state.message = `Эволюция! Теперь ты: ${evo.name}`;
  updateEvolutionUI();
};

const handleAttack = () => {
  if (state.gameOver) {
    return;
  }
  const range = player.radius + 32;
  let target = null;
  let minDistance = Infinity;

  enemies.forEach((enemy) => {
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const distance = Math.hypot(dx, dy);
    if (distance < range && distance < minDistance) {
      target = enemy;
      minDistance = distance;
    }
  });

  if (!target) {
    return;
  }

  target.health -= player.power;
  if (target.health <= 0) {
    enemies = enemies.filter((enemy) => enemy.id !== target.id);
    state.kills += 1;
    state.progress += 1;
    state.message = "Цель уничтожена!";

    if (state.progress >= evolutions[state.level].required) {
      evolve();
    }

    enemies.push(spawnEnemy());
  } else {
    state.message = "Удар успешен!";
  }
  updateEvolutionUI();
};

const updatePlayer = () => {
  const moveX = (keys.has("ArrowRight") || keys.has("d") ? 1 : 0) -
    (keys.has("ArrowLeft") || keys.has("a") ? 1 : 0);
  const moveY = (keys.has("ArrowDown") || keys.has("s") ? 1 : 0) -
    (keys.has("ArrowUp") || keys.has("w") ? 1 : 0);

  const magnitude = Math.hypot(moveX, moveY) || 1;
  let speed = player.speed;

  if (player.dashTimer > 0) {
    speed *= 2.2;
    player.dashTimer -= 1;
  } else if (player.dashCooldown > 0) {
    player.dashCooldown -= 1;
  }

  player.x += (moveX / magnitude) * speed;
  player.y += (moveY / magnitude) * speed;
  player.x = clamp(player.x, player.radius, canvas.width - player.radius);
  player.y = clamp(player.y, player.radius, canvas.height - player.radius);
};

const updateEnemies = () => {
  enemies.forEach((enemy) => {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const distance = Math.hypot(dx, dy) || 1;
    enemy.x += (dx / distance) * enemy.speed;
    enemy.y += (dy / distance) * enemy.speed;

    if (distance < enemy.radius + player.radius) {
      player.health -= enemy.power * 0.08;
    }
  });

  if (player.health <= 0 && !state.gameOver) {
    state.gameOver = true;
    state.message = "Ты пал. Нажми 'Новая симуляция' чтобы начать заново.";
  }
};

const draw = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(18, 24, 45, 0.6)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  enemies.forEach((enemy) => {
    ctx.beginPath();
    ctx.fillStyle = "rgba(255, 97, 124, 0.85)";
    ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    ctx.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius - 8, enemy.radius * 2, 4);
    ctx.fillStyle = "rgba(255, 97, 124, 0.9)";
    ctx.fillRect(
      enemy.x - enemy.radius,
      enemy.y - enemy.radius - 8,
      (enemy.radius * 2 * Math.max(0, enemy.health)) / (enemyConfig.baseHealth + state.level * 4),
      4
    );
  });

  ctx.beginPath();
  ctx.fillStyle = "rgba(124, 245, 255, 0.9)";
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(124, 245, 255, 0.35)";
  ctx.fillRect(player.x - 30, player.y + player.radius + 10, 60, 6);
  ctx.fillStyle = "rgba(124, 245, 255, 0.9)";
  ctx.fillRect(player.x - 30, player.y + player.radius + 10, 60 * (player.health / player.maxHealth), 6);

  if (state.message) {
    ctx.fillStyle = "rgba(15, 18, 35, 0.7)";
    ctx.fillRect(16, canvas.height - 54, canvas.width - 32, 38);
    ctx.fillStyle = "#f6f7ff";
    ctx.font = "15px Inter, sans-serif";
    ctx.fillText(state.message, 28, canvas.height - 30);
  }

  if (state.gameOver) {
    ctx.fillStyle = "rgba(8, 10, 20, 0.75)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ff617c";
    ctx.font = "24px Inter, sans-serif";
    ctx.fillText("Эволюция остановлена", 190, canvas.height / 2 - 10);
    ctx.fillStyle = "#f6f7ff";
    ctx.font = "16px Inter, sans-serif";
    ctx.fillText("Начни заново, чтобы попробовать еще раз.", 170, canvas.height / 2 + 20);
  }
};

const tick = () => {
  if (!state.gameOver) {
    updatePlayer();
    updateEnemies();
  }
  updateEvolutionUI();
  draw();
  requestAnimationFrame(tick);
};

const resetGame = () => {
  state.level = 0;
  state.kills = 0;
  state.progress = 0;
  state.gameOver = false;
  state.message = "Охота началась!";
  resetPlayer();
  resetEnemies();
  buildEvolutionList();
  updateEvolutionUI();
};

window.addEventListener("keydown", (event) => {
  if (event.repeat) {
    return;
  }
  keys.add(event.key);

  if (event.key === " " || event.code === "Space") {
    handleAttack();
  }

  if (event.key === "Shift" && player.dashCooldown === 0) {
    player.dashTimer = 14;
    player.dashCooldown = 90;
  }
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key);
});

restartButton.addEventListener("click", resetGame);

buildEvolutionList();
resetGame();
requestAnimationFrame(tick);

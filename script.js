const board = document.getElementById("board");
const cells = Array.from(document.querySelectorAll(".cell"));
const statusText = document.getElementById("statusText");
const restartButton = document.getElementById("restart");

const player = "X";
const bot = "O";
let state = Array(9).fill(null);
let gameActive = true;
let audioContext;

const WIN_COMBOS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const ensureAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
};

const playTone = (frequency, duration = 0.2, type = "sine", volume = 0.12) => {
  ensureAudioContext();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.value = volume;
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
};

const playPlaceSound = (symbol) => {
  if (symbol === "X") {
    playTone(440, 0.15, "triangle");
  } else {
    playTone(330, 0.15, "square");
  }
};

const playWinSound = () => {
  playTone(523.25, 0.18, "sine", 0.16);
  setTimeout(() => playTone(659.25, 0.18, "sine", 0.16), 160);
  setTimeout(() => playTone(783.99, 0.22, "sine", 0.18), 320);
};

const playLoseSound = () => {
  playTone(392, 0.2, "sawtooth", 0.14);
  setTimeout(() => playTone(311.13, 0.22, "sawtooth", 0.12), 190);
  setTimeout(() => playTone(246.94, 0.24, "sawtooth", 0.12), 370);
};

const updateStatus = (message) => {
  statusText.textContent = message;
};

const highlightWin = (combo) => {
  combo.forEach((index) => {
    cells[index].classList.add("win-cell");
  });
};

const clearHighlights = () => {
  cells.forEach((cell) => cell.classList.remove("win-cell"));
  board.classList.remove("win", "lose");
};

const checkWinner = () => {
  for (const combo of WIN_COMBOS) {
    const [a, b, c] = combo;
    if (state[a] && state[a] === state[b] && state[a] === state[c]) {
      return { winner: state[a], combo };
    }
  }
  if (state.every(Boolean)) {
    return { winner: "draw" };
  }
  return null;
};

const placeMark = (index, symbol) => {
  state[index] = symbol;
  const cell = cells[index];
  cell.textContent = symbol;
  cell.classList.add("filled", symbol.toLowerCase(), "pop");
  playPlaceSound(symbol);
  setTimeout(() => cell.classList.remove("pop"), 450);
};

const endGame = (result) => {
  gameActive = false;
  if (result.winner === "draw") {
    updateStatus("Ничья! Попробуем еще?");
    return;
  }

  highlightWin(result.combo);
  if (result.winner === player) {
    board.classList.add("win");
    updateStatus("Ты выиграл! Великолепно!");
    playWinSound();
  } else {
    board.classList.add("lose");
    updateStatus("Ты проиграл. Бот оказался хитрее.");
    playLoseSound();
  }
};

const botMove = () => {
  const available = state
    .map((value, index) => (value ? null : index))
    .filter((value) => value !== null);

  if (available.length === 0 || !gameActive) {
    return;
  }

  const choice = available[Math.floor(Math.random() * available.length)];
  placeMark(choice, bot);

  const result = checkWinner();
  if (result) {
    endGame(result);
  } else {
    updateStatus("Твой ход. Поставь X.");
  }
};

const handleCellClick = (event) => {
  const index = Number(event.currentTarget.dataset.index);
  if (!gameActive || state[index]) {
    return;
  }

  clearHighlights();
  placeMark(index, player);

  const result = checkWinner();
  if (result) {
    endGame(result);
    return;
  }

  updateStatus("Ход бота...");
  setTimeout(botMove, 500);
};

const resetGame = () => {
  state = Array(9).fill(null);
  gameActive = true;
  cells.forEach((cell) => {
    cell.textContent = "";
    cell.className = "cell";
  });
  clearHighlights();
  updateStatus("Твой ход. Поставь X.");
};

cells.forEach((cell) => cell.addEventListener("click", handleCellClick));
restartButton.addEventListener("click", resetGame);


(() => {
  const $ = (id) => document.getElementById(id);
  const screens = [...document.querySelectorAll(".screen")];
  const backBtn = $("backBtn");

  let level = 1, selectedOperation = null, questionIndex = 0, correctCount = 0;
  let currentQuestion = null, answerInput = "";
  let gameStartedAt = 0;

  // Load saved settings, or use defaults on first launch
  let inputMode = localStorage.getItem("arithmo_inputMode") || "keypad";
  let theme = localStorage.getItem("arithmo_theme") || "light";

  const levelNames = {1:"Easy", 2:"Medium", 3:"Hard"};
  const operationNames = {
    "+":"Addition",
    "-":"Subtraction",
    "*":"Multiplication",
    "/":"Division",
    "mixed":"Mixed"
  };

  // Apply saved settings when the app starts
  function applySavedSettings() {
    document.body.classList.toggle("dark", theme === "dark");

    document.querySelectorAll("[data-theme]").forEach(btn => {
      btn.classList.toggle("selected", btn.dataset.theme === theme);
    });

    document.querySelectorAll("[data-input]").forEach(btn => {
      btn.classList.toggle("selected", btn.dataset.input === inputMode);
    });
  }

  applySavedSettings();

  function showScreen(id) {
    screens.forEach(s => s.classList.toggle("active", s.id === id));
    backBtn.classList.toggle("hidden", id === "homeScreen" || id === "resultsScreen");
    $("menuBtn").classList.toggle("hidden", id === "gameScreen");
  }

  function goBack() {
    const current = screens.find(s => s.classList.contains("active"))?.id;
    if (current === "settingsScreen") showScreen("homeScreen");
    else if (current === "operationsScreen") showScreen("homeScreen");
    else if (current === "gameScreen") showScreen("operationsScreen");
  }

  backBtn.addEventListener("click", goBack);
  $("menuBtn").addEventListener("click", () => showScreen("settingsScreen"));

  document.querySelectorAll(".difficulty-card").forEach(btn =>
    btn.addEventListener("click", () => {
      level = Number(btn.dataset.level);
      document.querySelectorAll(".difficulty-card").forEach(x => x.classList.remove("selected"));
      btn.classList.add("selected");
      selectedOperation = null;
      document.querySelectorAll(".operation-card").forEach(x => x.classList.remove("selected"));
      showScreen("operationsScreen");
    })
  );

  document.querySelectorAll(".operation-card").forEach(btn =>
    btn.addEventListener("click", () => {
      selectedOperation = btn.dataset.op;
      document.querySelectorAll(".operation-card").forEach(x =>
        x.classList.toggle("selected", x === btn)
      );
    })
  );

  $("startBtn").addEventListener("click", () => {
    if (!selectedOperation) {
      const first = document.querySelector('.operation-card[data-op="+"]');
      selectedOperation = "+";
      document.querySelectorAll(".operation-card").forEach(x =>
        x.classList.toggle("selected", x === first)
      );
    }
    startGame();
  });

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function generateQuestion(op, diff) {
    let a, b;
    if (diff === 1) {
      a = randomInt(1, 20);
      b = randomInt(1, 10);
    } else if (diff === 2) {
      a = randomInt(10, 100);
      b = randomInt(10, 50);
    } else {
      a = randomInt(100, 1000);
      b = randomInt(10, 100);
    }

    if (op === "+") return {a, b, op, answer: a + b};
    if (op === "-") return {a, b, op, answer: a - b};
    if (op === "*") return {a, b, op, answer: a * b};

    if (op === "/") {
      b = randomInt(1, 20);
      const answer = randomInt(1, 20);
      a = b * answer;
      return {a, b, op, answer};
    }
  }

  function startGame() {
    questionIndex = 0;
    correctCount = 0;
    answerInput = "";
    gameStartedAt = Date.now();
    currentQuestion = null;
    showScreen("gameScreen");
    nextQuestion();
  }

  function nextQuestion() {
    if (questionIndex >= 10) {
      finishGame();
      return;
    }

    const pool = selectedOperation === "mixed"
      ? ["+", "-", "*", "/"]
      : [selectedOperation];

    currentQuestion = generateQuestion(
      pool[randomInt(0, pool.length - 1)],
      level
    );

    answerInput = "";
    $("levelLabel").textContent = `Level: ${levelNames[level]}`;
    $("questionCount").textContent = `${questionIndex + 1}/10`;
    $("progressFill").style.width = `${questionIndex * 10}%`;
    $("questionText").textContent =
      `${currentQuestion.a} ${currentQuestion.op} ${currentQuestion.b} =`;

    $("answerPreview").textContent = "";
    $("feedback").textContent = "";
    $("keypad").classList.toggle("hidden", inputMode !== "keypad");
    $("answerPreview").classList.toggle("hidden", inputMode === "options");
    $("optionAnswers").classList.toggle("hidden", inputMode !== "options");

    if (inputMode === "options") makeOptions();
  }

  function makeOptions() {
    const box = $("optionAnswers");
    box.innerHTML = "";
    const vals = new Set([currentQuestion.answer]);

    while (vals.size < 4) {
      const spread = Math.max(5, Math.abs(currentQuestion.answer) * 0.25);
      const n = currentQuestion.answer +
        randomInt(-Math.ceil(spread), Math.ceil(spread));

      if (n !== currentQuestion.answer) vals.add(n);
    }

    [...vals].sort(() => Math.random() - 0.5).forEach(value => {
      const btn = document.createElement("button");
      btn.textContent = value;
      btn.addEventListener("click", () => submitAnswer(value));
      box.appendChild(btn);
    });
  }

  function pressKey(key) {
    if (key === "clear") answerInput = answerInput.slice(0, -1);
    else if (key === "submit") {
      if (answerInput.trim() !== "") submitAnswer(Number(answerInput));
      return;
    } else if (answerInput.length < 12) {
      answerInput += key;
    }

    $("answerPreview").textContent = answerInput;
  }

  $("keypad").addEventListener("click", e => {
    const btn = e.target.closest("button[data-key]");
    if (btn) pressKey(btn.dataset.key);
  });

  document.addEventListener("keydown", e => {
    if (!$("gameScreen").classList.contains("active") || inputMode !== "keypad") return;
    if (/^[0-9]$/.test(e.key)) pressKey(e.key);
    else if (e.key === "Backspace") pressKey("clear");
    else if (e.key === "Enter") pressKey("submit");
  });

  function submitAnswer(value) {
    if (!currentQuestion) return;

    const correct = Number(value) === currentQuestion.answer;
    if (correct) correctCount++;

    $("feedback").textContent = correct
      ? "Correct!"
      : `Correct answer: ${currentQuestion.answer}`;

    $("feedback").style.color = correct ? "#12a665" : "#e06a39";
    questionIndex++;
    $("progressFill").style.width = `${questionIndex * 10}%`;
    currentQuestion = null;

    setTimeout(() => {
      if (questionIndex >= 10) finishGame();
      else nextQuestion();
    }, 550);
  }

  function finishGame() {
    if (!currentQuestion && questionIndex === 0) return;

    const accuracy = Math.round(correctCount / 10 * 100);
    const totalSeconds = Math.max(0, (Date.now() - gameStartedAt) / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);

    const totalTimeText = minutes > 0
      ? `${minutes}m ${seconds}s`
      : `${totalSeconds.toFixed(1)}s`;

    const averageSeconds = totalSeconds / 10;

    $("correctStat").textContent = `${correctCount}/10`;
    $("accuracyStat").textContent = `${accuracy}%`;
    $("totalTimeStat").textContent = totalTimeText;
    $("avgTimeStat").textContent = `${averageSeconds.toFixed(2)}s`;

    $("resultMessage").textContent = correctCount === 10
      ? "Excellent! Try a harder level."
      : correctCount >= 7
        ? "Good! Keep practising."
        : "Focus on accuracy before increasing speed.";

    currentQuestion = null;
    showScreen("resultsScreen");
  }

  $("playAgainBtn").addEventListener("click", startGame);
  $("homeBtn").addEventListener("click", () => showScreen("homeScreen"));

  // Save and apply theme whenever the user changes it
  document.querySelectorAll("[data-theme]").forEach(btn =>
    btn.addEventListener("click", () => {
      theme = btn.dataset.theme;
      localStorage.setItem("arithmo_theme", theme);

      document.body.classList.toggle("dark", theme === "dark");

      document.querySelectorAll("[data-theme]").forEach(x =>
        x.classList.toggle("selected", x === btn)
      );
    })
  );

  // Save input mode whenever the user changes it
  document.querySelectorAll("[data-input]").forEach(btn =>
    btn.addEventListener("click", () => {
      inputMode = btn.dataset.input;
      localStorage.setItem("arithmo_inputMode", inputMode);

      document.querySelectorAll("[data-input]").forEach(x =>
        x.classList.toggle("selected", x === btn)
      );
    })
  );
})();

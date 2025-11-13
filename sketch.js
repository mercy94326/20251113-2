// ==========================================
// 動物輪廓猜謎遊戲 - p5.js
// 根據輪廓猜測動物，從答案資料夾載入圖片
// ==========================================

let currentAnimalIndex = 0;
let animals = [];
let currentImg = null;
let silhouetteCanvas = null;
let currentScore = 0;
let totalAttempts = 0;
let showSilhouette = true;
let gameState = 'guessing'; // 'guessing' 或 'reveal'
let revealStartTime = 0;
let buttons = [];
let isCorrectGuess = false;
let currentButtonOrder = [];
let gameMode = 'menu'; // 'menu' | 'game1' | 'game2' | 'game3'
let menuButtons = [];
// 全域背景色
// 剪影遊戲自定義參數
let silhouetteBrightnessFactor = 0.15; // 亮度係數 (0.0 ~ 1.0)，數值越大越亮
let silhouetteFillColor = '#333333'; // 剪影主體顏色 (深灰色，可調整為其他深色)
let silhouetteOutlineColor = '#FFFFFF'; // 剪影輪廓顏色 (白色，可調整為其他亮色)
let silhouetteOutlineThickness = 3; // 剪影輪廓粗細 (像素)
const bgColor = '#B9D9EB';

// ==========================================
// 全域 UI 主題與設定
// ==========================================
const UI_THEME = {
  primary: '#4D61E3',
  accent: '#FF6B9D',
  hover: '#6C80F5',
  text: '#FFFFFF'
};

// 使用 `答案` 資料夾的最新圖片（請保持與資料夾檔名一致）
const animalNames = ['松鼠', '海豚', '熊貓', '豬', '貓咪', '鹿'];
const animalFiles = [
  '答案/松鼠.webp',
  '答案/海豚.jpg',
  '答案/熊貓.webp',
  '答案/豬.png',
  '答案/貓咪.jpg',
  '答案/鹿.webp'
];

function preload() {
  // 載入所有動物圖片
  for (let i = 0; i < animalFiles.length; i++) {
    try {
      let img = loadImage(animalFiles[i]);
      animals.push({
        img: img,
        name: animalNames[i],
        loaded: true
      });
    } catch (e) {
      animals.push({
        img: null,
        name: animalNames[i],
        loaded: false
      });
      console.log('無法載入: ' + animalFiles[i]);
    }
  }
}

function setup() {
  createCanvas(window.innerWidth, window.innerHeight);
  // 建立第一個輪廓（會同時建立亂序按鈕）
  createSilhouette();
  setupMenuButtons();
  backButton = { x: 60, y: 40, w: 100, h: 40 };
}

function setupButtons(order) {
  // order: array of animal indices indicating the display order
  buttons = [];
  let buttonW = 150;
  let buttonH = 50;
  let gapX = 60; // 按鈕間距

  let totalButtons = animalNames.length;
  let totalWidth = totalButtons * buttonW + (totalButtons - 1) * gapX;
  let startX = (width - totalWidth) / 2;
  let startY = height * 0.65;  // 距離頂部 65%

  // 如果沒有提供 order，就使用 0..n-1
  if (!order || order.length !== totalButtons) {
    order = [];
    for (let i = 0; i < totalButtons; i++) order.push(i);
  }

  for (let i = 0; i < totalButtons; i++) {
    let animalIdx = order[i];
    buttons.push({
      x: startX + i * (buttonW + gapX),
      y: startY,
      w: buttonW,
      h: buttonH,
      text: animalNames[animalIdx],
      animalIndex: animalIdx, // 實際對應的 animal 索引
      hovered: false
    });
  }
}

function shuffleIndices(n) {
  let arr = [];
  for (let i = 0; i < n; i++) arr.push(i);
  for (let i = n - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    let tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }
  return arr;
}

function createSilhouette() {
  if (!animals[currentAnimalIndex].loaded) {
    console.log('圖片未載入');
    return;
  }
  // 為本題建立亂序按鈕順序（包含正確答案）
  currentButtonOrder = shuffleIndices(animals.length);
  setupButtons(currentButtonOrder);
  
  let img = animals[currentAnimalIndex].img;
  
  // 建立輪廓用的 graphics buffer
  silhouetteCanvas = createGraphics(400, 300);
  
  // 將圖片繪製到 graphics，取得像素資訊以製作輪廓
  silhouetteCanvas.image(img, 0, 0, 400, 300);
  
  // 讀取像素，根據透明度建立清晰的剪影
  silhouetteCanvas.loadPixels();
  let d = silhouetteCanvas.pixelDensity();
  
  for (let i = 0; i < silhouetteCanvas.width; i++) {
    for (let j = 0; j < silhouetteCanvas.height; j++) {
      let pixelIndex = (i + j * silhouetteCanvas.width) * 4 * d * d;
      let r = silhouetteCanvas.pixels[pixelIndex];
      let g = silhouetteCanvas.pixels[pixelIndex + 1];
      let b = silhouetteCanvas.pixels[pixelIndex + 2];
      let alpha = silhouetteCanvas.pixels[pixelIndex + 3];
      
      // 只要像素不是完全透明，就將其亮度降低，而不是變為純黑
      if (alpha > 0) {
        const brightnessFactor = silhouetteBrightnessFactor; // 亮度係數 (0.0 ~ 1.0)，越小越黑
        silhouetteCanvas.pixels[pixelIndex] = r * brightnessFactor;     // R
        silhouetteCanvas.pixels[pixelIndex + 1] = g * brightnessFactor; // G
        silhouetteCanvas.pixels[pixelIndex + 2] = b * brightnessFactor; // B
        silhouetteCanvas.pixels[pixelIndex + 3] = 255;
      } else {
        // 其他部分（背景）設為完全透明
        silhouetteCanvas.pixels[pixelIndex + 3] = 0;
      }
    }
  }
  
  silhouetteCanvas.updatePixels();
}

function setupMenuButtons() {
  menuButtons = [];
  let w = 280, h = 220; // 卡片尺寸
  let gap = 40;
  let total = 3;
  let totalW = total * w + (total - 1) * gap;
  let startX = (width - totalW) / 2;
  let centerY = height / 2;

  const gameInfo = [
    { id: 1, title: '輪廓猜動物', icon: '🎨', desc: '根據動物的輪廓剪影，猜出牠的真實身份！' },
    { id: 2, title: '刺蝟知識挑戰', icon: '🦔', desc: '移動可愛的刺蝟，回答關於牠的冷知識問題。' },
    { id: 3, title: '動物冷知識配對', icon: '🧠', desc: '挑戰你的記憶力，配對動物和牠們的有趣知識！' }
  ];

  for (let i = 0; i < total; i++) {
    menuButtons.push({
      x: startX + i * (w + gap),
      y: centerY - h / 2,
      w: w, h: h,
      id: gameInfo[i].id,
      title: gameInfo[i].title,
      icon: gameInfo[i].icon,
      desc: gameInfo[i].desc
    });
  }
}

// dispatcher draw — p5 需要全域 draw()
function draw() {
  if (gameMode === 'menu') {
    drawMenu();
  } else if (gameMode === 'game1') {
    drawGame1(); // 原本的 draw 改名為 drawGame1
  } else if (gameMode === 'game2') {
    drawGame2(); // placeholder
  } else if (gameMode === 'game3') {
    drawGame3(); // placeholder
  }
}

// ========= 將原本的 draw 改名為 drawGame1（原有內容不變） =========
function drawGame1() {
  background(bgColor);
  drawBackButton();
  
  // 標題
  fill(40);
  textSize(32);
  textAlign(CENTER);
  textStyle(BOLD);
  text('🐾 動物輪廓猜謎遊戲', width / 2, 40);
  
  // 得分顯示
  fill(80);
  textSize(18);
  textStyle(NORMAL);
  textAlign(LEFT);
  text(`正確答案: ${currentScore} / ${Math.max(1, totalAttempts)}`, 30, 70);
  text(`目前題號: ${currentAnimalIndex + 1} / ${animals.length}`, 30, 95);
  
  if (gameState === 'guessing') {
    drawGuessingState();
  } else if (gameState === 'reveal') {
    drawRevealState();
  } else if (gameState === 'finished') {
    drawFinishedState();
  }
}

function drawMenu() {
  background(bgColor);
  fill(50);
  textSize(48);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  text('🐾 動物遊樂園 🐾', width / 2, height * 0.2);
  
  for (let b of menuButtons) {
    drawMenuCard(b);
  }

  // 小說明
  fill(80);
  textSize(14);
  textStyle(NORMAL);
  textAlign(CENTER);
  text('點擊卡片開始遊戲  |  按 Esc 鍵可隨時返回此選單', width / 2, height * 0.92);
}

// 新增：繪製選單卡片的函式
function drawMenuCard(card) {
  let isHovered = mouseX > card.x && mouseX < card.x + card.w &&
                  mouseY > card.y && mouseY < card.y + card.h;
  
  push();
  // 卡片陰影
  noStroke();
  fill(0, 0, 0, isHovered ? 60 : 30);
  // 懸停時陰影加深
  rect(card.x, card.y + (isHovered ? 10 : 5), card.w, card.h, 20);

  // 卡片主體
  fill(isHovered ? '#FFFFFF' : '#F0F8FF');
  stroke(isHovered ? UI_THEME.primary : '#D0E0F0');
  strokeWeight(isHovered ? 4 : 2);
  translate(0, isHovered ? -8 : 0); // 懸停時輕微上移
  rect(card.x, card.y, card.w, card.h, 20);

  // 卡片內容
  noStroke();
  textAlign(CENTER, CENTER);
  
  fill(0);
  textSize(80);
  text(card.icon, card.x + card.w / 2, card.y + card.h * 0.35);
  
  fill(UI_THEME.primary);
  textSize(22);
  textStyle(BOLD);
  text(card.title, card.x + card.w / 2, card.y + card.h * 0.65);
  
  fill(100);
  textSize(14);
  textStyle(NORMAL);
  // 使用 textBox 讓文字自動換行
  text(card.desc, card.x + 20, card.y + card.h * 0.78, card.w - 40);
  
  pop();
}

// 新增：統一風格的按鈕繪製函式
function drawStyledButton(btn, txt) {
  let isHovered = mouseX > btn.x - btn.w / 2 && mouseX < btn.x + btn.w / 2 &&
                  mouseY > btn.y - btn.h / 2 && mouseY < btn.y + btn.h / 2;

  push();
  rectMode(CENTER);
  textAlign(CENTER, CENTER);
  
  // 陰影
  fill(0, 0, 0, 40);
  noStroke();
  rect(btn.x, btn.y + 5, btn.w, btn.h, 15);

  // 按鈕主體
  fill(isHovered ? UI_THEME.hover : UI_THEME.primary);
  rect(btn.x, btn.y, btn.w, btn.h, 15);
  
  // 文字
  fill(UI_THEME.text);
  textSize(20);
  textStyle(BOLD);
  text(txt, btn.x, btn.y);
  pop();
}

// 新增：繪製返回主選單的按鈕
function drawBackButton() {
  let btn = backButton;
  let txt = '← 選單';
  let isHovered = mouseX > btn.x - btn.w / 2 && mouseX < btn.x + btn.w / 2 &&
                  mouseY > btn.y - btn.h / 2 && mouseY < btn.y + btn.h / 2;

  push();
  rectMode(CENTER);
  textAlign(CENTER, CENTER);

  // 使用一個較為低調的樣式
  fill(isHovered ? color(0, 0, 0, 50) : color(0, 0, 0, 20));
  noStroke();
  rect(btn.x, btn.y, btn.w, btn.h, 20); // 圓角藥丸形狀

  fill(isHovered ? 0 : 80);
  textSize(16);
  textStyle(BOLD);
  text(txt, btn.x, btn.y);
  pop();
}

// ========= 將原本的 mousePressed 改名為 mousePressedGame1 =========
function mousePressedGame1() {
  if (gameState === 'guessing') {
    // 檢查是否點擊了答案按鈕
    for (let btn of buttons) {
      if (mouseX > btn.x && mouseX < btn.x + btn.w &&
          mouseY > btn.y && mouseY < btn.y + btn.h) {
        // 玩家猜測
        isCorrectGuess = (btn.animalIndex === currentAnimalIndex);
        
        if (isCorrectGuess) {
          currentScore++;
        }
        totalAttempts++;
        
        // 切換到顯示答案狀態
        gameState = 'reveal';
        revealStartTime = millis();
        return;
      }
    }
  } else if (gameState === 'reveal') {
    // 檢查是否點擊 "下一題" 按鈕
    let btn = { x: width / 2, y: height * 0.8, w: 180, h: 55 };
    if (mouseX > btn.x - btn.w/2 && mouseX < btn.x + btn.w/2 && mouseY > btn.y - btn.h/2 && mouseY < btn.y + btn.h/2) {
      nextQuestionGame1();  // 修正為 nextQuestionGame1
    }
  } else if (gameState === 'finished') {
    // 檢查是否點擊重新開始按鈕
    let btn = { x: width / 2, y: height * 0.6, w: 220, h: 60 };
    if (mouseX > btn.x - btn.w/2 && mouseX < btn.x + btn.w/2 && mouseY > btn.y - btn.h/2 && mouseY < btn.y + btn.h/2) {
      restartGameGame1();  // 修正為 restartGameGame1
    }
  }
}

// ========= 同理改名其他 game1 的函式（nextQuestion / restartGame / windowResized / keyPressed） =========
function nextQuestionGame1() {
  currentAnimalIndex++;
  
  // 如果已經完成所有題目，進入結算畫面
  if (currentAnimalIndex >= animals.length) {
    gameState = 'finished';
    // 總結畫面會顯示 currentScore 與 totalAttempts
    return;
  }

  gameState = 'guessing';
  showSilhouette = true;
  createSilhouette();
}

function restartGameGame1() {
  currentAnimalIndex = 0;
  currentScore = 0;
  totalAttempts = 0;
  gameState = 'guessing';
  createSilhouette();
}

function windowResizedGame1() {
  // 畫面大小改變時重設 canvas 與按鈕布局
  resizeCanvas(window.innerWidth, window.innerHeight);
  setupButtons(currentButtonOrder);
}

function keyPressedGame1() {
  if (key === 'r' || key === 'R') {
    // 重置遊戲
    currentAnimalIndex = 0;
    currentScore = 0;
    totalAttempts = 0;
    gameState = 'guessing';
    createSilhouette();
  }
}

// ========= 全域的 mousePressed / keyPressed / windowResized 轉發器 =========
function mousePressed() {
  // 優先檢查返回按鈕
  if (gameMode !== 'menu' && checkBackButton()) {
    return;
  }

  if (gameMode === 'menu') {
    mousePressedMenu();
  } else if (gameMode === 'game1') {
    mousePressedGame1();
  } else if (gameMode === 'game2') {
    mousePressedGame2();
  } else if (gameMode === 'game3') {
    mousePressedGame3();
  }
}

function mousePressedMenu() {
  for (let b of menuButtons) {
    if (mouseX > b.x && mouseX < b.x + b.w && mouseY > b.y && mouseY < b.y + b.h) {
      if (b.id === 1) { gameMode = 'game1'; createSilhouette(); } 
      else if (b.id === 2) { gameMode = 'game2'; loadGame2(); } 
      else if (b.id === 3) { gameMode = 'game3'; loadGame3(); }
      return;
    }
  }
}

function checkBackButton() {
  let btn = backButton;
  if (mouseX > btn.x - btn.w / 2 && mouseX < btn.x + btn.w / 2 &&
      mouseY > btn.y - btn.h / 2 && mouseY < btn.y + btn.h / 2) {
    gameMode = 'menu';
    setupMenuButtons();
    return true;
  }
  return false;
}

function keyPressed() {
  if (keyCode === ESCAPE) {
    gameMode = 'menu';
    setupMenuButtons();
    return;
  }
  if (gameMode === 'game1') keyPressedGame1();
  else if (gameMode === 'game2') keyPressedGame2();
  else if (gameMode === 'game3') keyPressedGame3();
}

function windowResized() {
  resizeCanvas(window.innerWidth, window.innerHeight);
  if (gameMode === 'menu') setupMenuButtons();
  else if (gameMode === 'game1') windowResizedGame1();
  else if (gameMode === 'game2') windowResizedGame2();
  else if (gameMode === 'game3') windowResizedGame3();
}

// ========= placeholders for Game2 / Game3 (replace with your real code) =========
/*
  已整合：第二個遊戲「刺蝟冷知識挑戰」到 loadGame2/drawGame2，
  並以 g2_ 前綴隔離變數與函式，避免與遊戲一衝突。
*/
// ========= Game2: 刺蝟冷知識挑戰（namespaced 為 g2_） =========
let g2_initialized = false;
let g2_player = {
  img: null,
  loaded: false,
  x: 0,
  y: 0,
  size: 150, // 將刺蝟的大小從 100 增加到 130
  speed: 50,
  bobbingAngle: 0
};
let g2_questionIndex = 0;
let g2_score = 0;
let g2_message = "";
let g2_gameState = 'START'; // 'START' | 'PLAYING' | 'GAME_OVER'
let g2_lastAnswerTime = 0;
let g2_answeredCorrectly = null;

const g2_questions = [
  { text: "刺蝟是兩棲動物。", answer: false },
  { text: "刺蝟遇到危險時會蜷縮成球。", answer: true },
  { text: "刺蝟會把刺射出去攻擊敵人。", answer: false },
  { text: "刺蝟可以游泳。", answer: true },
  { text: "刺蝟白天很活躍。", answer: false }
];

const g2_COLORS = {
  CORRECT_COLOR: "#4CAF50",
  WRONG_COLOR: "#F44336",
  PRIMARY_TEXT_COLOR: "#1a1a1a",
  SECONDARY_TEXT_COLOR: "#666",
  BG_COLOR_TOP: "#FFE5EC",
  BG_COLOR_BOTTOM: "#FFB3D9",
  ACCENT_COLOR: "#FF6B9D"
}; // Game 2 專屬顏色，保留其獨特風格

let g2_circleArea, g2_crossArea;
let g2_startButton, g2_restartButton;

// 請根據你的專案結構放置圖片，這裡預設放在 ../20251112-main/character.png 或與 sketch 同一資料夾
const g2_characterPathCandidates = [
  'character.png',  // 同一資料夾（最常用）
  './character.png',  // 顯式相對路徑
  '../character.png'  // 如果在父資料夾
];

function loadGame2() {
  // 初始化或重設遊戲2的狀態
  g2_initialized = true;
  g2_questionIndex = 0;
  g2_score = 0;
  g2_message = "";
  g2_answeredCorrectly = null;
  g2_gameState = 'START';
  g2_lastAnswerTime = 0;

  // 將作答區改為以畫面中心為基準，並設定固定間距
  const answerAreaOffset = 180; // 圓圈中心到畫面中心的距離
  // 設定區域與按鈕位置（根據目前 canvas 大小）
  g2_circleArea = { x: width / 2 - answerAreaOffset, y: height - 80, size: 120 };
  g2_crossArea = { x: width / 2 + answerAreaOffset, y: height - 80, size: 120 };
  g2_startButton = { x: width / 2, y: height / 2 + 80, w: 200, h: 60 };
  g2_restartButton = { x: width / 2, y: height / 2 + 200, w: 200, h: 60 };

  // 載入角色圖片（嘗試多個路徑）
  g2_player.loaded = false;
  let loaded = false;
  
  for (let p of g2_characterPathCandidates) {
    if (loaded) break;
    g2_player.img = loadImage(p, 
      () => {
        g2_player.loaded = true;
        loaded = true;
        console.log('✅ 成功載入: ' + p);
      }, 
      () => {
        console.log('❌ 無法載入: ' + p);
      }
    );
  }

  // 初始化玩家位置
  g2_player.x = width / 2;
  g2_player.y = height - 115; // 稍微上移以適應新的大小
}

function drawGame2() {
  if (!g2_initialized) {
    loadGame2();
  }

  // 使用遊戲2的背景與 UI
  drawG2GradientBackground();
  drawBackButton();

  if (g2_gameState === 'START') {
    drawG2StartScreen();
  } else if (g2_gameState === 'PLAYING') {
    drawG2Game();
  } else if (g2_gameState === 'GAME_OVER') {
    drawG2GameOverScreen();
  }
}

/* ---------- g2 繪製 / 邏輯函式 ---------- */
function drawG2GradientBackground() {
  for (let i = 0; i < height; i++) {
    let inter = map(i, 0, height, 0, 1);
    let c = lerpColor(color(g2_COLORS.BG_COLOR_TOP), color(g2_COLORS.BG_COLOR_BOTTOM), inter);
    stroke(c);
    line(0, i, width, i);
  }
  drawG2DecorationCircles();
  if (g2_gameState !== 'GAME_OVER') drawG2GrassArea();
}

function drawG2DecorationCircles() {
  noStroke();
  fill(255, 255, 255, 60);
  ellipse(80, 100, 80, 80);
  ellipse(width - 100, 150, 120, 120);
  ellipse(120, height - 120, 100, 100);
  ellipse(width - 140, height - 100, 90, 90);
  ellipse(width / 2, height / 2 - 100, 60, 60);
}

function drawG2GrassArea() {
  push(); // 保存當前的繪圖設定
  rectMode(CENTER); // 將矩形繪製模式設為中心
  fill(76, 175, 80, 80);
  noStroke();
  rect(width / 2, height - 20, width, 60);
  stroke(76, 175, 80, 150);
  strokeWeight(2);
  line(0, height - 50, width, height - 50);
  pop(); // 恢復先前的繪圖設定
}

function drawG2Player() {
  g2_player.bobbingAngle += 0.05;
  let bobbingOffset = sin(g2_player.bobbingAngle) * 5;

  push();
  fill(0, 0, 0, 20);
  noStroke();
  ellipse(g2_player.x, g2_player.y + g2_player.size / 2 + 10, g2_player.size * 0.9, g2_player.size * 0.3);
  pop();

  if (g2_player.loaded && g2_player.img) {
    image(g2_player.img,
      g2_player.x - g2_player.size / 2,
      g2_player.y - g2_player.size / 2 + bobbingOffset,
      g2_player.size,
      g2_player.size);
  } else {
    // 替代簡單圖示（若圖片尚未載入）
    push();
    fill(200);
    stroke(150);
    ellipse(g2_player.x, g2_player.y, g2_player.size, g2_player.size);
    pop();
  }
}

function drawG2StartScreen() {
  textSize(56);
  fill(g2_COLORS.PRIMARY_TEXT_COLOR);
  textStyle(BOLD);
  text("🦔 刺蝟冷知識挑戰 🦔", width / 2, height / 2 - 100);

  textSize(18);
  fill(g2_COLORS.SECONDARY_TEXT_COLOR);
  textStyle(NORMAL);
  text("用左右方向鍵移動，選擇 ⭕ 或 ❌ 來答題", width / 2, height / 2 - 20);

  drawG2Button(g2_startButton, "開始遊戲");
}

function drawG2Game() {
  drawG2ProgressBar();
  fill(g2_COLORS.PRIMARY_TEXT_COLOR);
  textSize(28);
  textStyle(BOLD);
  text(g2_questions[g2_questionIndex].text, width / 2, 70);
  drawG2Options();
  drawG2Player();
  if (g2_message) drawG2MessageBox();
  g2_checkAnswerCollision();
}

function drawG2ProgressBar() {
  push(); // 保存當前的繪圖設定
  rectMode(CENTER); // 將矩形繪製模式設為中心

  fill(220);
  noStroke();
  rect(width / 2, 25, width - 40, 12, 6);
  fill(g2_COLORS.ACCENT_COLOR);
  let progress = (g2_questionIndex / g2_questions.length) * (width - 40);
  // 由於是 CENTER 模式，我們需要從左邊緣開始計算 x 座標
  rect(20 + progress / 2, 25, progress, 12, 6); 
  fill(g2_COLORS.SECONDARY_TEXT_COLOR);
  textSize(14);
  textAlign(RIGHT);
  text(`第 ${g2_questionIndex + 1} / ${g2_questions.length} 題`, width - 20, 28);
  pop(); // 恢復先前的繪圖設定
}

function drawG2MessageBox() {
  rectMode(CENTER); // 將矩形繪製模式設為中心
  textAlign(CENTER, CENTER); // 將文字對齊模式設為中心
  let bg = g2_message.includes("✅") ? color(76, 175, 80, 200) : color(244, 67, 54, 200);
  fill(bg);
  noStroke();
  rect(width / 2, height / 2 + 50, 300, 60, 10);
  textSize(24);
  fill(255);
  textStyle(BOLD);
  text(g2_message, width / 2, height / 2 + 50);
  rectMode(CORNER); // 恢復預設模式，避免影響其他函式
}

function drawG2GameOverScreen() {
  rectMode(CENTER); // 將矩形繪製模式設為中心，方便對齊
  fill(0, 0, 0, 100);
  noStroke();
  rect(width / 2, height / 2, width, height);

  textSize(48);
  fill(g2_COLORS.PRIMARY_TEXT_COLOR);
  textStyle(BOLD);
  text("🎉 遊戲結束！🎉", width / 2, height / 2 - 150);

  push();
  fill(0, 0, 0, 15);
  noStroke();
  rect(width / 2, height / 2, 380, 180, 20);
  pop();

  fill(255);
  stroke(g2_COLORS.ACCENT_COLOR);
  strokeWeight(3);
  rect(width / 2, height / 2, 380, 180, 20);

  textSize(72);
  fill(g2_COLORS.ACCENT_COLOR);
  textStyle(BOLD);
  text(`${g2_score}`, width / 2 - 80, height / 2 - 20);

  stroke(200);
  strokeWeight(2);
  line(width / 2 - 30, height / 2 - 60, width / 2 - 30, height / 2 + 60);

  textAlign(LEFT);
  textSize(18);
  fill(g2_COLORS.SECONDARY_TEXT_COLOR);
  textStyle(NORMAL);
  text(`總題數：${g2_questions.length}`, width / 2 + 20, height / 2 - 30);
  text(`正確數：${g2_score}`, width / 2 + 20, height / 2);
  text(`錯誤數：${g2_questions.length - g2_score}`, width / 2 + 20, height / 2 + 30);

  let percentage = Math.round((g2_score / g2_questions.length) * 100);
  let ratingText = "";
  let ratingColor = "";
  if (percentage === 100) { ratingText = "⭐ 完美滿分！"; ratingColor = "#FFD700"; }
  else if (percentage >= 80) { ratingText = "🌟 優秀表現！"; ratingColor = "#4CAF50"; }
  else if (percentage >= 60) { ratingText = "👍 不錯喔！"; ratingColor = "#FF9800"; }
  else { ratingText = "💪 再加油！"; ratingColor = "#F44336"; }

  textAlign(CENTER, CENTER); // 確保垂直也置中
  textSize(24);
  fill(ratingColor);
  textStyle(BOLD);
  text(ratingText, width / 2, height / 2 + 70);

  drawG2PercentageBar(percentage);
  drawStyledButton(g2_restartButton, "🔄 重新開始");
  textSize(14);
  fill(g2_COLORS.SECONDARY_TEXT_COLOR);
  textStyle(ITALIC);
  rectMode(CORNER); // 恢復預設的矩形繪製模式，避免影響其他函式
}

function drawG2PercentageBar(percentage) {
  let barWidth = 300;
  let barHeight = 16;
  let barX = width / 2;
  let barY = height / 2 + 105;

  rectMode(CENTER); // 使用中心模式繪製進度條
  fill(230);
  noStroke();
  rect(barX, barY, barWidth, barHeight, 8);

  let progressWidth = (percentage / 100) * barWidth;
  let progressColor;
  if (percentage === 100) progressColor = color("#FFD700");
  else if (percentage >= 80) progressColor = color("#4CAF50");
  else if (percentage >= 60) progressColor = color("#FF9800");
  else progressColor = color("#F44336");

  fill(progressColor);
  // 由於 rect() 現在是從中心點繪製，我們需要調整 x 座標
  rect(barX - (barWidth - progressWidth) / 2, barY, progressWidth, barHeight, 8);

  textSize(16);
  fill(255);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text(`${percentage}%`, barX, barY); // 文字也置中於進度條
}

function drawG2Button(btn, txt) {
  // 直接呼叫新的統一風格按鈕函式
  // 為了保持 Game 2 的粉色系，這裡可以做個小客製化
  drawStyledButton(btn, txt);
}

function drawG2Options() {
  let timeSinceAnswer = millis() - g2_lastAnswerTime;
  let animDuration = 500;
  let circleHover = dist(mouseX, mouseY, g2_circleArea.x, g2_circleArea.y) < g2_circleArea.size / 2;
  let circleScale = 1;
  if (g2_answeredCorrectly === true && timeSinceAnswer < animDuration) {
    circleScale = 1 + 0.2 * sin(map(timeSinceAnswer, 0, animDuration, 0, PI));
  }
  drawG2Symbol('circle', g2_circleArea.x, g2_circleArea.y, g2_circleArea.size * 0.7, circleHover, circleScale);

  let crossHover = dist(mouseX, mouseY, g2_crossArea.x, g2_crossArea.y) < g2_crossArea.size / 2;
  let crossScale = 1;
  if (g2_answeredCorrectly === false && timeSinceAnswer < animDuration) {
    crossScale = 1 + 0.2 * sin(map(timeSinceAnswer, 0, animDuration, 0, PI));
  }
  drawG2Symbol('cross', g2_crossArea.x, g2_crossArea.y, g2_crossArea.size * 0.7, crossHover, crossScale);
}

function drawG2Symbol(type, x, y, size, isHovered, scaleAmount = 1) {
  push();
  translate(x, y);
  scale(scaleAmount);
  if (isHovered) {
    fill(0, 0, 0, 10);
    noStroke();
    ellipse(0, 0, size + 30, size + 30);
  }
  noFill();
  strokeWeight(isHovered ? 14 : 8);
  if (type === 'circle') {
    stroke(g2_COLORS.CORRECT_COLOR);
    ellipse(0, 0, size, size);
  } else {
    stroke(g2_COLORS.WRONG_COLOR);
    let r = size / 2;
    line(-r, -r, r, r);
    line(r, -r, -r, r);
  }
  pop();
}

function g2_checkAnswerCollision() {
  let q = g2_questions[g2_questionIndex];
  let answerGiven = null;
  if (dist(g2_player.x, g2_player.y, g2_circleArea.x, g2_circleArea.y) < g2_circleArea.size / 2) {
    answerGiven = true;
  }
  if (dist(g2_player.x, g2_player.y, g2_crossArea.x, g2_crossArea.y) < g2_crossArea.size / 2) {
    answerGiven = false;
  }
  if (answerGiven !== null) {
    if (answerGiven === q.answer) {
      g2_message = "✅ 答對了！";
      g2_score++;
      g2_answeredCorrectly = q.answer;
    } else {
      g2_message = "❌ 答錯了！";
      g2_answeredCorrectly = !q.answer;
    }
    g2_lastAnswerTime = millis();
    g2_questionIndex++;
    g2_player.x = width / 2;
    if (g2_questionIndex >= g2_questions.length) {
      g2_gameState = 'GAME_OVER';
      g2_message = "";
    } else {
      setTimeout(() => {
        g2_message = "";
        g2_answeredCorrectly = null;
      }, 800);
    }
  }
}

/* ---------- g2 事件處理（供 dispatcher 呼叫） ---------- */
function mousePressedGame2() {
  if (!g2_initialized) loadGame2();
  if (g2_gameState === 'START') {
    let isClicked = mouseX > g2_startButton.x - g2_startButton.w / 2 && mouseX < g2_startButton.x + g2_startButton.w / 2 &&
                    mouseY > g2_startButton.y - g2_startButton.h / 2 && mouseY < g2_startButton.y + g2_startButton.h / 2;
    if (isClicked) g2_gameState = 'PLAYING';
  } else if (g2_gameState === 'GAME_OVER') {
    let isClicked = mouseX > g2_restartButton.x - g2_restartButton.w / 2 && mouseX < g2_restartButton.x + g2_restartButton.w / 2 &&
                    mouseY > g2_restartButton.y - g2_restartButton.h / 2 && mouseY < g2_restartButton.y + g2_restartButton.h / 2;
    if (isClicked) {
      g2_questionIndex = 0;
      g2_score = 0;
      g2_message = "";
      g2_answeredCorrectly = null;
      g2_gameState = 'PLAYING';
      g2_player.x = width / 2;
    }
  }
}

function keyPressedGame2() {
  if (!g2_initialized) loadGame2();
  if (g2_gameState !== 'PLAYING') return;
  if (keyCode === LEFT_ARROW) {
    g2_player.x -= g2_player.speed;
  } else if (keyCode === RIGHT_ARROW) {
    g2_player.x += g2_player.speed;
  }
  g2_player.x = constrain(g2_player.x, g2_player.size / 2, width - g2_player.size / 2);
}

function windowResizedGame2() {
  // 將作答區改為以畫面中心為基準，並設定固定間距
  const answerAreaOffset = 180; // 圓圈中心到畫面中心的距離
  // 更新依賴 width/height 的區域配置
  g2_circleArea = { x: width / 2 - answerAreaOffset, y: height - 80, size: 120 };
  g2_crossArea = { x: width / 2 + answerAreaOffset, y: height - 80, size: 120 };
  g2_startButton = { x: width / 2, y: height / 2 + 80, w: 200, h: 60 };
  g2_restartButton = { x: width / 2, y: height / 2 + 200, w: 200, h: 60 };
  g2_player.x = constrain(g2_player.x, g2_player.size / 2, width - g2_player.size / 2);
}

// 繪製猜測狀態
function drawGuessingState() {
  // 繪製輪廓 - 居中顯示
  if (silhouetteCanvas) {
    push(); // 隔離繪圖設定，避免 tint() 影響其他繪圖
    let silW = silhouetteCanvas.width;
    let silH = silhouetteCanvas.height;
    let silX = (width - silW) / 2;
    let silY = height * 0.12;

    // 繪製輪廓線 (稍微放大並著色為輪廓顏色)
    tint(silhouetteOutlineColor);
    image(
      silhouetteCanvas,
      silX - silhouetteOutlineThickness,
      silY - silhouetteOutlineThickness,
      silW + silhouetteOutlineThickness * 2,
      silH + silhouetteOutlineThickness * 2
    );
    noTint(); // 重置 tint

    // 繪製剪影主體 (正常大小並著色為剪影顏色)
    image(silhouetteCanvas, silX, silY);
    pop(); // 恢復繪圖設定

    // 加上邊框
    noFill();
    stroke(100);
    strokeWeight(2);
    rect(silX, silY, silW, silH);
  }

  // 說明文字
  fill(60);
  textSize(Math.max(14, Math.round(width * 0.02)));
  textAlign(CENTER);
  text('根據輪廓猜測這是哪種動物？', width / 2, height * 0.6);

  // 繪製選擇按鈕
  for (let btn of buttons) {
    btn.hovered = mouseX > btn.x && mouseX < btn.x + btn.w &&
                  mouseY > btn.y && mouseY < btn.y + btn.h;    
    // 使用新的按鈕函式，注意座標轉換
    drawStyledButton({x: btn.x + btn.w/2, y: btn.y + btn.h/2, w: btn.w, h: btn.h}, btn.text);
  }
}

// 繪製揭曉狀態
function drawRevealState() {
  // 加入淡入背景，讓結果更突出
  let revealProgress = min(1, (millis() - revealStartTime) / 400);
  fill(255, 255, 255, 150 * revealProgress);
  rect(0, 0, width, height);

  // 顯示原始圖片 - 居中
  if (animals[currentAnimalIndex].loaded) {
    let imgW = 400;
    let imgH = 300;
    let imgX = (width - imgW) / 2;
    let imgY = height * 0.12;
    image(animals[currentAnimalIndex].img, imgX, imgY, imgW, imgH);

    noFill();
    stroke(100);
    strokeWeight(2);
    rect(imgX, imgY, imgW, imgH);
  }

  // 顯示結果
  fill(isCorrectGuess ? [0, 150, 80] : [200, 80, 80]);
  textSize(28);
  textAlign(CENTER);
  textStyle(BOLD);
  text(isCorrectGuess ? '✓ 正確！' : '✗ 錯誤', width / 2, height * 0.6);

  fill(40);
  textSize(20);
  textStyle(NORMAL);
  text(`答案是：${animals[currentAnimalIndex].name}`, width / 2, height * 0.65);

  // "下一題" 按鈕，置中並使用新樣式
  drawStyledButton({ x: width / 2, y: height * 0.8, w: 180, h: 55 }, '下一題 →');
}

// 結算畫面
function drawFinishedState() {
  // 結算畫面
  fill(255);
  textSize(36);
  textAlign(CENTER);
  textStyle(BOLD);
  text('🎉 遊戲結束！', width / 2, height * 0.35);

  fill(40);
  textSize(24);
  textStyle(NORMAL);
  text(`最終得分: ${currentScore} / ${Math.max(1, totalAttempts)}`, width / 2, height * 0.45);
  text(`正確率: ${Math.round((currentScore / totalAttempts) * 100)}%`, width / 2, height * 0.50);

  // 重新開始按鈕
  let restartBtn = { x: width / 2, y: height * 0.6, w: 220, h: 60 };
  drawStyledButton(restartBtn, '🔄 重新開始');
}

// ========= Game3: 動物冷知識配對遊戲（namespaced 為 g3_） =========
let g3_cards = [];
let g3_flipped = [];
let g3_matched = [];
let g3_matchedTime = 0;
let g3_gameComplete = false;
let g3_initialized = false;

const g3_animalData = [
  { name: "章魚", facts: "有3個心臟", color: "#FF6B9D" },
  { name: "貓咪", facts: "有32塊肌肉控制耳朵", color: "#FFA502" },
  { name: "蜜蜂", facts: "能跳舞溝通", color: "#FFD93D" },
  { name: "企鵝", facts: "游泳速度40km/h", color: "#6BCB77" },
  { name: "大象", facts: "記憶力超強", color: "#4D96FF" },
  { name: "烏鴉", facts: "智商等於7歲小孩", color: "#9D84B7" }
];

function loadGame3() {
  g3_initialized = true;
  g3_gameComplete = false;
  g3_matched = [];
  g3_flipped = [];
  g3_matchedTime = 0;
  g3_initCards();
}

function drawGame3() {
  if (!g3_initialized) {
    loadGame3();
  }
  
  background('#E8F3F9'); // 使用更柔和的背景色
  drawBackButton();
  g3_displayCards();
  g3_drawParticles();
  g3_displayTitle();
  
  if (g3_gameComplete) {
    g3_displayCompleteScreen();
  }
}

function g3_initCards() {
  let temp = [];
  g3_animalData.forEach((animal, idx) => {
    temp.push({ id: idx, type: "image", ...animal, particles: [] });
    temp.push({ id: idx, type: "text", ...animal, particles: [] });
  });
  
  g3_cards = g3_shuffle(temp);
  g3_cards.forEach((card, idx) => {
    card.index = idx;
  });
}

function g3_displayTitle() {
  fill(0);
  textSize(36);
  textAlign(CENTER);
  textStyle(BOLD);
  text("🐾 動物冷知識配對遊戲", width / 2, 50);
  textSize(20);
  text("已配對: " + (g3_matched.length / 2) + " / 6", width / 2, 90);
}

function g3_displayCards() {
  const cols = 4;
  const cardW = 140;
  const cardH = 140;
  const spacingX = 180;
  const spacingY = 180;
  const startX = (width - cols * spacingX) / 2;
  const startY = 140;
  
  for (let i = 0; i < g3_cards.length; i++) {
    let row = Math.floor(i / cols);
    let col = i % cols;
    let x = startX + col * spacingX;
    let y = startY + row * spacingY;
    
    g3_drawCard(x, y, cardW, cardH, i);
  }
}

function g3_drawCard(x, y, w, h, idx) {
  let card = g3_cards[idx];
  let isMatched = g3_matched.includes(idx);
  let isFlipped = g3_flipped.includes(idx);
  
  card.x = x;
  card.y = y;
  card.w = w;
  card.h = h;
  
  if (isMatched) {
    // 配對成功後的效果
    let timeSinceMatched = frameCount - g3_matchedTime;
    let alpha = map(timeSinceMatched, 0, 30, 255, 100, true);
    fill(red(card.color), green(card.color), blue(card.color), alpha);
    noStroke();
    rect(x, y, w, h, 10);
    
    fill(255);
    if (card.type === "image") {
      textSize(60);
      textAlign(CENTER, CENTER);
      g3_drawAnimal(x + w / 2, y + h / 2 - 25, card.name);
      textSize(16);
      textStyle(NORMAL);
      text(card.name, x + w / 2, y + h / 2 + 35);
    } else {
      textSize(15);
      textStyle(NORMAL);
      textAlign(CENTER, CENTER);
      text(card.facts, x + w / 2 - 60, y + h / 2 - 15, 120, 80);
    }
  } else if (isFlipped) {
    // 翻開時的效果
    fill(255);
    stroke(card.color);
    strokeWeight(4);
    rect(x, y, w, h, 10);
    
    fill(255);
    if (card.type === "image") {
      textSize(60);
      textAlign(CENTER, CENTER);
      g3_drawAnimal(x + w / 2, y + h / 2 - 25, card.name);
      textSize(16);
      textStyle(NORMAL);
      text(card.name, x + w / 2, y + h / 2 + 35);
    } else {
      textSize(15);
      textStyle(NORMAL);
      textAlign(CENTER, CENTER);
      text(card.facts, x + w / 2 - 60, y + h / 2 - 15, 120, 80);
    }
  } else {
    // 未翻開的卡片
    let isHovered = mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h;
    fill(isHovered ? UI_THEME.hover : UI_THEME.primary);
    noStroke();
    rect(x, y, w, h, 10);
    
    fill(UI_THEME.text);
    textSize(50);
    textAlign(CENTER, CENTER);
    text("?", x + w / 2, y + h / 2);
  }
}

function g3_drawAnimal(x, y, name) {
  fill(0);
  textAlign(CENTER, CENTER);
  
  switch(name) {
    case "章魚": text("🐙", x, y); break;
    case "貓咪": text("🐱", x, y); break;
    case "蜜蜂": text("🐝", x, y); break;
    case "企鵝": text("🐧", x, y); break;
    case "大象": text("🐘", x, y); break;
    case "烏鴉": text("🐦", x, y); break;
  }
}

function g3_checkMatch() {
  let card1 = g3_cards[g3_flipped[0]];
  let card2 = g3_cards[g3_flipped[1]];
  
  if (card1.id === card2.id && card1.type !== card2.type) {
    g3_matched.push(g3_flipped[0], g3_flipped[1]);
    g3_matchedTime = frameCount;
    
    // 生成粒子特效
    g3_createParticles(card1.x + card1.w / 2, card1.y + card1.h / 2, g3_flipped[0]);
    g3_createParticles(card2.x + card2.w / 2, card2.y + card2.h / 2, g3_flipped[1]);
    
    g3_flipped = [];
    
    if (g3_matched.length === g3_cards.length) {
      g3_gameComplete = true;
      g3_finishGame();
    }
  } else {
    setTimeout(() => { g3_flipped = []; }, 800);
  }
}

function g3_finishGame() {
  console.log("遊戲三完成！");
}

function g3_displayCompleteScreen() {
  // 半透明黑色背景
  fill(0, 0, 0, 200);
  rect(0, 0, width, height);
  
  // 恭喜文字
  fill(255, 215, 0);
  textSize(80);
  textAlign(CENTER, CENTER);
  textStyle(NORMAL);
  text("🎉", width / 2, height / 2 - 100);
  
  fill(255);
  textSize(50);
  text("恭喜你完成了！", width / 2, height / 2);
  
  // 使用統一風格的按鈕
  let restartBtn = { x: width / 2, y: height / 2 + 100, w: 220, h: 60 };
  drawStyledButton(restartBtn, '🔄 再玩一次');
}

function g3_createParticles(x, y, cardIdx) {
  let card = g3_cards[cardIdx];
  for (let i = 0; i < 20; i++) {
    let angle = (TWO_PI / 20) * i;
    let speed = random(3, 8);
    let particle = {
      x: x,
      y: y,
      vx: cos(angle) * speed,
      vy: sin(angle) * speed,
      life: 1,
      color: card.color,
      size: random(6, 14)
    };
    card.particles.push(particle);
  }
  
  // 添加星形粒子
  for (let i = 0; i < 8; i++) {
    let angle = (TWO_PI / 8) * i;
    let particle = {
      x: x,
      y: y,
      vx: cos(angle) * 6,
      vy: sin(angle) * 6,
      life: 1,
      color: "#FFD700",
      size: random(4, 8),
      isstar: true
    };
    card.particles.push(particle);
  }
}

function g3_drawParticles() {
  for (let card of g3_cards) {
    if (card.particles.length === 0) continue;
    
    for (let i = card.particles.length - 1; i >= 0; i--) {
      let p = card.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.life -= 0.015;
      
      let alpha = Math.floor(p.life * 255);
      fill(p.color + alpha.toString(16).padStart(2, '0'));
      noStroke();
      
      if (p.isstar) {
        g3_drawStar(p.x, p.y, p.size / 2, p.size, 5);
      } else {
        circle(p.x, p.y, p.size);
      }
      
      if (p.life <= 0) {
        card.particles.splice(i, 1);
      }
    }
  }
}

function g3_drawStar(x, y, innerRadius, outerRadius, points) {
  beginShape();
  for (let i = 0; i < points * 2; i++) {
    let radius = i % 2 === 0 ? outerRadius : innerRadius;
    let angle = TWO_PI / (points * 2) * i - PI / 2;
    let sx = x + cos(angle) * radius;
    let sy = y + sin(angle) * radius;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}

function mousePressedGame3() {
  if (g3_gameComplete) {
    // 檢查是否點擊重新開始按鈕
    let btn = { x: width / 2, y: height / 2 + 100, w: 220, h: 60 };
    if (mouseX > btn.x - btn.w/2 && mouseX < btn.x + btn.w/2 && mouseY > btn.y - btn.h/2 && mouseY < btn.y + btn.h/2) {
      loadGame3(); // 重新載入遊戲
      return;
    }
  }
  
  if (g3_flipped.length >= 2) return;
  
  for (let card of g3_cards) {
    if (mouseX > card.x && mouseX < card.x + card.w &&
        mouseY > card.y && mouseY < card.y + card.h) {
      
      let idx = card.index;
      if (!g3_flipped.includes(idx) && !g3_matched.includes(idx)) {
        g3_flipped.push(idx);
        
        if (g3_flipped.length === 2) {
          g3_checkMatch();
        }
      }
    }
  }
}

function g3_shuffle(arr) {
  let result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

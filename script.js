const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let score = 0;
let highScore = 0;
let keysDown = {};
let moles = [];
let moleCount = 0;
const moleLimit = 10;
const timeLimit = 10000;
let loadedImages = [];
let moleId = "";

function randomNumber(n) {
  return Math.floor(Math.random() * n);
}

const spritesheet = {
  frameIndex: 0,
  frameWidth: 32,
  numFrames: 6,
  isAnimating: false,
};

const ground = {
  x: 0,
  y: 0,
  w: canvas.width * 0.9,
  h: canvas.height,
};

const map = {
  x: 0,
  y: 0,
  w: canvas.width,
  h: canvas.height,
  tileSize: 32,
  // can generate a grid for w /32 and h /32 reps
  // then store info of object in each square
  grid: [],
};

// define variables
const { tileSize, w, h } = map;
let numColumns = Math.floor(w / tileSize);
let numRows = Math.floor(h / tileSize);

const player = {
  lives: 3,
  x: 32,
  y: 32,
  w: 64,
  h: 64,
  dx: 0,
  dy: 0,
  prevPosition: { x: 0, y: 0 },
  speed: 1,
  dashMultiplier: 5,
  dashCount: 3,
  dashCooldown: 3000,
  dashDuration: 500,
  sprite: "",
  isDashing: false,
  invulnerable: false,
};

// define objects for obstacle generation

function createTile(x, y) {
  return { x, y, w: map.tileSize, h: map.tileSize };
}

// event listeners for motion

document.addEventListener("keydown", (e) => {
  keysDown[e.key] = true;
  console.log(keysDown);
  updatePlayer();
});

document.addEventListener("keyup", (e) => {
  keysDown[e.key] = false;
  updatePlayer();
});

function handleDashMovement() {
  if (player.dashCount > 0 && !player.isDashing) {
    player.isDashing = true;
    player.dashCount -= 1;
    const initialVelocityX = player.dx;
    const initialVelocityY = player.dy;
    player.dy *= player.dashMultiplier;
    player.dx *= player.dashMultiplier;

    setTimeout(() => {
      player.isDashing = false;
      player.dy = initialVelocityX;
      player.dx = initialVelocityY;
    }, player.dashDuration);
    setTimeout(() => {
      player.dashCount += 1;
    }, player.dashCooldown);
  }
  // over 1000 ms,
  // increase velocity by 4x
  // set timeout, set reset velocity to 0
}

function updatePlayer() {
  // handle player movement
  if (!player.isDashing && !spritesheet.isAnimating) {
    if (keysDown["w"] || keysDown["ArrowUp"]) {
      player.dy = -player.speed;
      player.sprite = loadedImages.up;
    } else if (keysDown["s"] || keysDown["ArrowDown"]) {
      player.dy = player.speed;
      player.sprite = loadedImages.down;
    } else {
      player.dy = 0;
      player.sprite = loadedImages.rest;
    }

    if (keysDown["a"] || keysDown["ArrowLeft"]) {
      player.dx = -player.speed;
      player.sprite = loadedImages.left;
    } else if (keysDown["d"] || keysDown["ArrowRight"]) {
      player.dx = player.speed;
      player.sprite = loadedImages.right;
    } else {
      player.dx = 0;
    }
  }
  if (keysDown[" "]) {
    handleDashMovement();
  }

  // handle hit detection with for each mole
  moles.forEach((mole) => {
    if (
      player.x + player.w > mole.x &&
      player.x < mole.x + mole.w &&
      player.y + player.h > mole.y &&
      player.y < mole.y + mole.h
    ) {
      // if mole is vulnerable, then
      if (mole.vulnerable) {
        updateScore();
        moles = moles.filter((someMole) => someMole !== mole);
      } else {
        // remove some life and prevent damage for 1 second
        if (!player.invulnerable) player.lives -= 1;
        player.invulnerable = true;
        setTimeout(() => {
          player.invulnerable = false;
        }, 1000);
        // extend shield duration and
        mole.vulnerable = false;
        setTimeout(() => {
          mole.vulnerable = true;
        }, mole.shieldDuration);
      }

      // stop player
      animate();

      player.dx = 0;
      player.dy = 0;
    }
  });
  const waterTiles = map.grid.flat().filter((tile) => tile.src === "water");
  waterTiles.forEach((tile) => {
    if (
      player.x + player.w > tile.x &&
      player.x < tile.x + tile.w &&
      player.y + player.h > tile.y &&
      player.y < tile.y + tile.h
    ) {
      player.x = canvas.width / 2;
      player.y = canvas.height / 2;
      player.dx = 0;
      player.dy = 0;
      player.lives -= 1;
    }
  });

  // Update player's position
  player.x += player.dx;
  player.y += player.dy;

  if (player.lives <= 0) {
    gameOver();
  }
}

function updateScore() {
  score += 1;
  if (score >= highScore) {
    highScore = score;
  }
}

function gameOver() {
  moles = [];
  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
  player.dx = 0;
  player.dy = 0;
  player.lives = 3;
  score = 0;
  generateTiles();
}

function generateMole() {
  // Generate a random position for the mole
  const { grid, tileSize } = map;
  const numRows = grid.length;
  const numColumns = grid[0].length;

  // Generate random row and column indices within the grid bounds
  let randomRow = Math.floor(Math.random() * numRows);
  let randomColumn = Math.floor(Math.random() * numColumns);
  while (grid[randomRow][randomColumn].occupied) {
    randomRow = Math.floor(Math.random() * numRows);
    randomColumn = Math.floor(Math.random() * numColumns);
  }
  grid[randomRow][randomColumn].occupied = true;

  // Create the mole object and set its position based on the random indices
  const newMole = createMole(randomColumn * tileSize, randomRow * tileSize);
  // peek, then show the mole
  setTimeout(() => {
    newMole.vulnerable = true;
  }, newMole.shieldDuration);
  // burrow mole
  setTimeout(() => {
    newMole.vulnerable = false;
  }, newMole.duration - newMole.shieldDuration);
  // destory mole
  setTimeout(() => {
    // destroy molef
    grid[randomRow][randomColumn].occupied = false;
    moles = moles.filter((mole) => mole !== newMole);
  }, newMole.duration);
  moles.push(newMole);
}

// generate a grid of squares for the map
function generateTiles() {
  const { tileSize } = map;
  for (let r = 0; r < numRows; r++) {
    map.grid[r] = [];
    for (let c = 0; c < numColumns; c++) {
      const tile = createTile(c * tileSize, r * tileSize);
      if (r === 0 || r == numRows - 1 || c === 0 || c == numColumns - 1) {
        tile.src = "water";
        tile.occupied = true;
        tile.color = "blue";
      } else {
        tile.color = "green";
        if (Math.random() < 0.2) {
          if (Math.random() > 0.5) {
            tile.src = "grass1";
          } else {
            tile.src = "grass2";
          }
        }
      }
      map.grid[r][c] = tile;
    }
  }
}

// mole duration determines max moles on screen
function createMole(x, y) {
  return {
    x,
    y,
    w: tileSize,
    h: tileSize,
    duration: 5000,
    shieldDuration: 1000,
    vulnerable: false,
  };
}

// mkae sure images are ready to be drawn whe nneeded
function preloadImages() {
  let images = {
    rest: "./assets/hammer-rest.png",
    down: "./assets/hammer-down.png",
    up: "./assets/hammer-up.png",
    left: "./assets/hammer-left.png",
    right: "./assets/hammer-right.png",
    sheetRight: "./assets/spritesheet-right.png",
    sheetLeft: "./assets/spritesheet-left.png",
    moleUp: "./assets/mole-up.png",
    moleDown: "./assets/mole-down.png",
    heartEmpty: "./assets/heart-empty.png",
    heartFull: "./assets/heart-full.png",
    grass1: "./assets/grass1.png",
    grass2: "./assets/grass2.png",
    water: "./assets/water.png",
  };
  let promises = [];
  for (let key in images) {
    promises.push(
      new Promise((resolve, reject) => {
        let img = new Image();
        img.src = images[key];
        img.onload = () => {
          loadedImages[key] = img;
          resolve();
        };
        img.onerror = () => {
          reject("Failed to load image: ", +key);
        };
      })
    );
  }
  return Promise.all(promises);
}

// increase velocity

function drawTiles() {
  // Iterate over the grid and draw each tile
  const { tileSize, grid } = map;
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      const tile = grid[r][c];

      ctx.fillStyle = tile.color;
      ctx.fillRect(tile.x, tile.y, tileSize, tileSize); // Draw the rectangle for the tile
      if (loadedImages[tile.src]) {
        ctx.drawImage(
          loadedImages[tile.src],
          tile.x,
          tile.y,
          tileSize,
          tileSize
        ); // draw the image for the tile
      }
    }
  }
}

function drawMoles() {
  moles.forEach((mole) => {
    if (mole.vulnerable) {
      ctx.drawImage(loadedImages.moleUp, mole.x, mole.y, mole.w, mole.h);
    } else {
      ctx.drawImage(loadedImages.moleDown, mole.x, mole.y, mole.w, mole.h);
    }
  });
}

function drawPlayer() {
  if (spritesheet.isAnimating) {
    const srcX = spritesheet.frameIndex * spritesheet.frameWidth;
    ctx.drawImage(
      player.sprite,
      srcX,
      0,
      spritesheet.frameWidth,
      spritesheet.frameWidth,
      player.x,
      player.y,
      player.w,
      player.h
    );
  } else {
    ctx.drawImage(player.sprite, player.x, player.y, player.w, player.h);
  }
}
function drawText(text, isLeft = false) {
  ctx.font = "32px Loved by the King"; // Change this to the desired font and size
  ctx.fillStyle = "white"; // Change this to the desired color
  let x = "";
  const padding = 10; // Padding from the edge of the canvas
  const textWidth = ctx.measureText(text).width; // Calculate the width of the text
  if (isLeft) {
    x = 100;
  } else {
    x = canvas.width - textWidth;
  }
  const y = canvas.height - 15; // Position the text from the bottom edge of the canvas

  ctx.fillText(text, x, y);
}

function drawHearts() {
  const heartSize = 32;
  const heartPadding = 10;
  for (let i = 0; i < 3; i++) {
    let heartImage;
    if (i < player.lives) {
      heartImage = loadedImages.heartFull;
    } else {
      heartImage = loadedImages.heartEmpty;
    }

    const x = i * (heartSize + heartPadding);
    const y = 2; // Set this to the y-position where you want the hearts to be drawn
    ctx.drawImage(heartImage, x, y, heartSize, heartSize);
  }
}

function drawInstructions() {
  // Set the font, size, and style
  ctx.font = "30px Loved by the King";
  ctx.textAlign = "center";
  ctx.fillStyle = "white";

  // Draw the text at the bottom center of the canvas
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;
  const textPositionX = canvasWidth / 2;
  const textPositionY = canvasHeight - 15;
  ctx.fillText("[ Spacebar to dash ]", textPositionX, textPositionY);
}

// animation funcitons for hammer smash

function advanceFrame() {
  spritesheet.frameIndex++;
  if (spritesheet.frameIndex >= spritesheet.numFrames) {
    clearInterval(intervalId);
    spritesheet.frameIndex = 0;
    spritesheet.isAnimating = false;
    player.sprite = loadedImages.rest;
    player.dx = 0;
    player.dy = 0;
    keysDown = {};
  }
}

function animate() {
  if (!spritesheet.isAnimating) {
    if (keysDown["a"] || keysDown["ArrowLeft"]) {
      player.sprite = loadedImages.sheetLeft;
    } else if (keysDown["d"] || keysDown["ArrowRight"]) {
      player.sprite = loadedImages.sheetRight;
    } else {
      player.sprite = loadedImages.sheetRight;
    }
    spritesheet.isAnimating = true;
    intervalId = setInterval(advanceFrame, 100);
  }
}

function setCanvasDimensions() {
  // Determine smallest side of the screen
  const minDimension = Math.min(window.innerWidth, window.innerHeight);

  // Determine the largest multiple of 32 that is smaller than the smallest side
  const largestMultiple = minDimension - (minDimension % 32);

  // Set the canvas dimensions
  canvas.width = largestMultiple;
  canvas.height = largestMultiple;

  // Recalculate grid after resizing
  numColumns = Math.floor(canvas.width / tileSize);
  numRows = Math.floor(canvas.height / tileSize);

  // Reinitialize the game
  init();
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  updatePlayer();
  // drawMap();
  drawTiles();
  drawPlayer();
  drawMoles();
  drawHearts();
  drawInstructions();
  drawText(`Score: ${score}`);
  drawText(`High Score: ${highScore}`, true);
  // set interval for mole generation
  requestAnimationFrame(gameLoop);
}

function init() {
  map.grid = [];
  player.speed = 1.5;
  player.sprite = loadedImages.rest;
  clearInterval(moleId);
  map.w = canvas.width;
  map.h = canvas.height;
  numColumns = Math.floor(canvas.width / tileSize);
  numRows = Math.floor(canvas.height / tileSize);
  moles = [];
  generateTiles();
  moleId = setInterval(generateMole, 1000);
  gameLoop();
}

preloadImages().then(() => {
  // setCanvasDimensions();
  init();
});

// On page load

// When the window is resized
window.addEventListener("resize", setCanvasDimensions);

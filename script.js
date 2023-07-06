const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const keysDown = {};

const ground = {
  x: 0,
  y: 0,
  w: canvas.width * 0.9,
  h: canvas.height,
};

const player = {
  x: 0,
  y: 0,
  w: 50,
  h: 100,
  dx: 0,
  dy: 0,
  speed: 5,
  dashMultiplier: 8,
  dashCount: 3,
  dashCooldown: 3000,
  dashDuration: 1000,
  direction: "",
};

// event listeners for motion

document.addEventListener("keydown", (e) => {
  keysDown[e.key] = true;
  console.log("down: ", keysDown);
  updatePlayer();
});

document.addEventListener("keyup", (e) => {
  keysDown[e.key] = false;
  console.log("up: ", keysDown);
  updatePlayer();
});

function handleDashMovement() {
  if (player.dashCount > 0) {
    player.dashCount -= 1;
    player.dy *= player.dashMultiplier;
    player.dx *= player.dashMultiplier;
    setTimeout(() => {
      player.dy = 0;
      player.dx = 0;
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
  if (keysDown["w"]) {
    player.dy = -player.speed;
  } else if (keysDown["s"]) {
    player.dy = player.speed;
  } else {
    player.dy = 0;
  }

  if (keysDown["a"]) {
    player.dx = -player.speed;
  } else if (keysDown["d"]) {
    player.dx = player.speed;
  } else {
    player.dx = 0;
  }

  if (keysDown[" "]) {
    handleDashMovement();
  }

  // Update player's position
  player.x += player.dx;
  player.y += player.dy;

  // handle collisions
}

// increase velocity

function drawPlayer() {
  ctx.fillStyle = "red";
  ctx.fillRect(player.x, player.y, player.w, player.h);
}

function drawMap() {
  ctx.fillStyle = "blue";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "green";
  ctx.fillRect(ground.x, ground.y, ground.w, ground.h);
}

function gameLoop() {
  updatePlayer();
  drawMap();
  drawPlayer();
  requestAnimationFrame(gameLoop);
}
gameLoop();

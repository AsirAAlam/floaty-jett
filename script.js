const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');
canvas.width = 1280;
canvas.height = 720;

const fps = 60;

const platformImg = new Image();
platformImg.src = './images/ascent/ascent platform.png';
const backgroundImg = new Image();
backgroundImg.src = './images/ascent/ascent background-min.png';
const foregroundImg = new Image();
foregroundImg.src = './images/ascent/ascent foreground-min.png';
const botRightImg = new Image();
botRightImg.src = './images/bot/bot-right.png';
const botLeftImg = new Image();
botLeftImg.src = './images/bot/bot-left.png';
const knifeRightImg = new Image();
knifeRightImg.src = './images/jett/knife-right.png';
const knifeLeftImg = new Image();
knifeLeftImg.src = './images/jett/knife-left.png';
const jettFloatRight = new Image();
jettFloatRight.src = './images/jett/jett-float-right.png';
const jettFloatLeft = new Image();
jettFloatLeft.src = './images/jett/jett-float-left.png';
const jettSpriteStand = new Image();
jettSpriteStand.src = './images/jett/jett-sprite.png';
let spriteAnimationSpeed = 16; // Larger value = slower animation

const gravity = 0.75;
const scrollXLimit = 4096;
var scrollX = 0;
const scrollYLimit = -1024;
var scrollY = 0;

var debug = false;

const scrollStart = {
  left: Math.floor(canvas.width / 8),
  right: Math.floor(canvas.width / 2),
  up: Math.floor(canvas.height / 8),
  down: canvas.height
}

const keys = {
  up: {
    pressed: false,
  },
  down: {
    pressed: false,
  },
  left: {
    pressed: false,
  },
  right: {
    pressed: false,
  },
  space: {
    pressed: false,
  },
  lastPressedStk: new Array()
}

class Knife {
  static velx = 32;

  // dir -> {-1, 1}
  constructor(x, y, dir) {
    this.pos = {
      x,
      y
    }
    this.dir = dir;
    this.distanceTraveled = 0;
  }

  update() {
    this.pos.x += Knife.velx * this.dir;
    this.distanceTraveled += Math.abs(Knife.velx * this.dir);
  }

  draw() {
    c.drawImage(this.dir === 1 ? knifeRightImg : knifeLeftImg, this.pos.x, this.pos.y);
  }
}

class Player {
  static playerJump = 20;
  static driftGravityReduction = 0.7;

  // Must divide scrollXLimit
  static playerSpeed = 8;

  constructor() {
    // Must be inside the scroll limits
    this.pos = {
      x: scrollStart.left,
      y: scrollStart.up
    }
    this.vel = {
      x: 0,
      y: 0
    }
    this.width = 128;
    this.height = 128;
    this.downCount = 0;
    this.onAirPlatform = false;
    this.onFloorPlatform = false;
    this.frameIndex = 0;
    this.facing = 'right';
    this.canAirJump = false;
    this.knives = [];
  }

  createKnife() {
    this.knives.push(new Knife(this.pos.x + this.width / 2, this.pos.y + this.height / 2, this.facing === 'right' ? 1 : -1));
  }

  inAir() {
    return !this.onAirPlatform && !this.onFloorPlatform;
  }

  draw() {
    if (this.inAir()) {
      const jettFloatImg = this.facing == 'right' ? jettFloatRight : jettFloatLeft;
      c.drawImage(jettFloatImg, 0, 0, 128, 128, this.pos.x, this.pos.y, this.width, this.height);
    } else {
      const spriteRowIndex = this.facing == 'right' ? 0 : 1;
      c.drawImage(jettSpriteStand, Math.floor(this.frameIndex / spriteAnimationSpeed) * 128, spriteRowIndex * 128, 128, 128, this.pos.x, this.pos.y, this.width, this.height);
    }
  }

  update() {
    this.frameIndex = (this.frameIndex + 1) % (4 * spriteAnimationSpeed);

    // Horizontal movement
    if (keys.lastPressedStk[keys.lastPressedStk.length - 1] == 'right') {
      this.vel.x = Player.playerSpeed;
      this.facing = 'right';
    } else if (keys.lastPressedStk[keys.lastPressedStk.length - 1] == 'left') {
      this.vel.x = -Player.playerSpeed;
      this.facing = 'left';
    } else {
      this.vel.x = 0;
    }

    this.pos.x += this.vel.x;

    if (this.onAirPlatform && this.vel.y !== 0) {
      this.onAirPlatform = false;
      this.downCount = 0;
    }

    if (this.onFloorPlatform && this.vel.y !== 0) {
      this.onFloorPlatform = false;
    }

    // Vertical movement + gravity
    if (this.pos.y + this.height + this.vel.y < canvas.height) {
      this.pos.y += this.vel.y;
      this.vel.y += gravity;
      if (keys.up.pressed && this.vel.y > 0) {
        this.vel.y -= Player.driftGravityReduction;
        this.vel.y = Math.max(0, this.vel.y);
      }
    } else {
      this.pos.y = canvas.height - this.height;
      this.vel.y = 0;
    }
  }
}

class Bot {
  // Must divide scrollXLimit
  static speed = 2;
  static turnTime = 256;

  constructor(x, y) {
    // Must be inside the scroll limits
    this.pos = {
      x,
      y
    }
    this.vel = {
      x: Bot.speed,
      y: 0
    }
    this.width = 128;
    this.height = 128;
    this.onAirPlatform = false;
    this.onFloorPlatform = false;
    this.facing = 'right';
    this.stepCounter = 0;
  }

  createBullet() {
    this.knives.push(new Knife(this.pos.x + this.width / 2, this.pos.y + this.height / 2, this.facing === 'right' ? 1 : -1));
  }

  draw() {
    const img = this.facing == 'right' ? botRightImg : botLeftImg;
    c.drawImage(img, 0, 0, 128, 128, this.pos.x, this.pos.y, this.width, this.height);
  }

  update() {
    if (this.stepCounter === Bot.turnTime) {
      this.stepCounter = 0;
      this.facing = this.facing === 'right' ? 'left' : 'right';
      this.vel.x = this.facing === 'left' ? -Bot.speed : Bot.speed;
    }

    this.pos.x += this.vel.x;
    this.stepCounter++;

    if (this.onAirPlatform && this.vel.y !== 0) {
      this.onAirPlatform = false;
    }

    if (this.onFloorPlatform && this.vel.y !== 0) {
      this.onFloorPlatform = false;
    }

    // Vertical movement + gravity
    if (this.pos.y + this.height + this.vel.y < canvas.height) {
      this.pos.y += this.vel.y;
      this.vel.y += gravity;
    }
  }
}

const bots = [];

class Platform {
  static img = platformImg;

  constructor(x, y, isFloor = false, spawnBot = false) {
    this.pos = {
      x,
      y
    }
    this.isFloor = isFloor;

    this.bot = null;

    if (spawnBot) {
      this.bot = new Bot(x, y - 128);
      bots.push(this.bot);
    }
  }

  draw() {
    c.drawImage(Platform.img, this.pos.x, this.pos.y);
  }
}

class GenericObject {
  constructor(x, y, img) {
    this.pos = {
      x,
      y
    }
    this.img = img;
  }

  draw() {
    c.drawImage(this.img, this.pos.x, this.pos.y);
  }
}

const p = new Player();


const platforms = [
  new Platform(256, 400, false, true),
  new Platform(1024, 256, false, Math.random() < 0.5),
  new Platform(2048, 256, false, Math.random() < 0.5),
];

const background = new GenericObject(0, 0, backgroundImg);
const foreground = new GenericObject(0, 0, foregroundImg);

// Create floor platforms
Platform.img.onload = () => {
  scrollStart.down = canvas.height - Platform.img.height - p.height;
  const numFloorPlatforms = 16;
  for (let i = 0; i < numFloorPlatforms; i++) {
    platforms.push(new Platform(i * Platform.img.width - 2 * i - 1, canvas.height - Platform.img.height, true));
  }
}

function animate() {
  // The offsets are there to only include the character and not the knives for platform collision
  const playerLeftX = p.pos.x + (p.facing === 'right' ? 40 : 38);
  const playerRightX = p.pos.x + p.width - (p.facing === 'right' ? 38 : 40);

  // Platform collision
  platforms.forEach(platform => {
    if (p.pos.y + p.height <= platform.pos.y &&
      p.pos.y + p.height + p.vel.y >= platform.pos.y &&
      playerRightX >= platform.pos.x &&
      playerLeftX <= platform.pos.x + Platform.img.width) {

      // If this is an air platform and the player is not already on an air platform
      if (!platform.isFloor && !p.onAirPlatform) {
        p.onAirPlatform = true;
      }

      // If this is a floor platform and the player is not already on a floor platform
      if (platform.isFloor && !p.onFloorPlatform) {
        p.onFloorPlatform = true;
      }

      if (!p.canAirJump) {
        p.canAirJump = true;
      }

      p.pos.y = platform.pos.y - p.height;
      p.vel.y = 0;
    }

    bots.forEach(bot => {
      const botLeftX = bot.pos.x + (bot.facing === 'right' ? 40 : 38);
      const botRightX = bot.pos.x + bot.width - (bot.facing === 'right' ? 38 : 40);

      if (bot.pos.y + bot.height <= platform.pos.y &&
        bot.pos.y + bot.height + bot.vel.y >= platform.pos.y &&
        botRightX >= platform.pos.x &&
        botLeftX <= platform.pos.x + Platform.img.width) {

        // If this is an air platform and the player is not already on an air platform
        if (!platform.isFloor && !p.onAirPlatform) {
          bot.onAirPlatform = true;
        }

        // If this is a floor platform and the player is not already on a floor platform
        if (platform.isFloor && !p.onFloorPlatform) {
          bot.onFloorPlatform = true;
        }

        bot.pos.y = platform.pos.y - p.height;
        bot.vel.y = 0;
      }
    });

  });

  bots.forEach(bot => bot.update());
  p.update();

  // Update knives
  p.knives.forEach(knife => {
    knife.update();
  });

  // Horizontal scrolling
  let scrollXChange = 0;

  if (p.pos.x + p.width > scrollStart.right) {
    scrollXChange = p.pos.x + p.width - scrollStart.right;
  } else if (p.pos.x < scrollStart.left) {
    scrollXChange = p.pos.x - scrollStart.left;
  }

  if (scrollX + scrollXChange >= 0 && scrollX + scrollXChange <= scrollXLimit) {
    scrollX += scrollXChange;

    platforms.forEach(platform => platform.pos.x -= scrollXChange);
    p.knives.forEach(knife => knife.pos.x -= scrollXChange);
    bots.forEach(bot => bot.pos.x -= scrollXChange);
    foreground.pos.x -= scrollXChange / 2;
  }

  if (scrollX > 0 && scrollX < scrollXLimit) {
    p.pos.x -= scrollXChange;
  }

  p.pos.x = Math.max(p.pos.x, 0);
  p.pos.x = Math.min(p.pos.x, canvas.width - p.width);

  // Vertical scrolling
  const scrollYChange = p.pos.y < scrollStart.up ? p.pos.y - scrollStart.up :
    (p.pos.y > scrollStart.down ? p.pos.y - scrollStart.down : 0);

  if (scrollY + scrollYChange <= 0 && scrollY + scrollYChange >= scrollYLimit) {
    scrollY += scrollYChange;

    platforms.forEach(platform => platform.pos.y -= scrollYChange);
    foreground.pos.y -= scrollYChange;
    bots.forEach(bot => bot.pos.y -= scrollYChange);
  }

  if (scrollY < 0 && scrollY > scrollYLimit) {
    p.pos.y -= scrollYChange;
  }

  // Debug mode
  const deb = document.getElementById('deb');
  deb.innerHTML = 'scrollY ' + scrollY + ' ' + 'scrollX ' + scrollX + ' ' + 'onFloor ' + p.onFloorPlatform + ' ' + 'onAirPlat ' + p.onAirPlatform;
  deb.innerHTML += ' space: ' + keys.space.pressed;
  deb.innerHTML += ' knives: ' + p.knives.length;

  p.pos.y = Math.max(p.pos.y, 0);
  p.pos.y = Math.min(p.pos.y, canvas.height - p.height - Platform.img.height);

  // Clear objects from last frame
  c.fillStyle = 'white';
  c.fillRect(0, 0, canvas.width, canvas.height);

  // Draw objects from next frame
  background.draw();
  foreground.draw();
  platforms.forEach(platform => platform.draw());
  bots.forEach(bot => bot.draw());
  p.draw();

  p.knives.forEach(knife => knife.draw());
  p.knives = p.knives.filter(knife => knife.distanceTraveled <= scrollXLimit + canvas.width);
}

const interval = 1000 / fps;
var then;

function draw(timestamp) {
  requestAnimationFrame(draw);

  // assign to 'then' for the first run
  if (then === undefined) {
    then = timestamp;
  }

  const delta = timestamp - then;

  if (delta > interval) {
    // update time stuffs

    // Just `then = now` is not enough.
    // Lets say we set fps at 10 which means
    // each frame must take 100ms
    // Now frame executes in 16ms (60fps) so
    // the loop iterates 7 times (16*7 = 112ms) until
    // delta > interval === true
    // Eventually this lowers down the FPS as
    // 112*10 = 1120ms (NOT 1000ms).
    // So we have to get rid of that extra 12ms
    // by subtracting delta (112) % interval (100).
    // Hope that makes sense.

    then = timestamp - (delta % interval);

    // ... Code for Drawing the Frame ...
    animate();
  }
}

draw();

addEventListener('keydown', (event) => {
  switch (event.key) {
    case 'w':
      if (!keys.up.pressed) {
        keys.up.pressed = true;

        if (p.onAirPlatform || p.onFloorPlatform) {
          p.vel.y = -Player.playerJump;
        } else if (p.canAirJump) {
          p.vel.y = -Player.playerJump;
          p.canAirJump = false;
        }
      }
      break;
    case 'a':
      if (!keys.left.pressed) {
        keys.left.pressed = true;
        keys.lastPressedStk.push('left');
        p.downCount = 0;
      }
      break;
    case 's':
      if (!keys.down.pressed) {
        keys.down.pressed = true;

        if (p.onAirPlatform) {
          p.downCount++;

          if (p.downCount === 2) {
            p.pos.y++;
          }
        }
      }
      break;
    case 'd':
      if (!keys.right.pressed) {
        keys.right.pressed = true;
        keys.lastPressedStk.push('right');
        p.downCount = 0;
      }
      break;
  }

  switch (event.code) {
    case 'Space':
      if (!keys.space.pressed) {
        keys.space.pressed = true;

        // Create knife
        p.createKnife();
      }
      break;
  }

  // Debug mode
  if (event.key === '.') {
    const deb = document.getElementById('deb');

    if (!debug) {
      deb.style.display = 'block';
    } else {
      deb.style.display = 'none';
    }
    debug = !debug;
  }
});

addEventListener('keyup', (event) => {
  let idxToRemove;

  switch (event.key) {
    case 'w':
      keys.up.pressed = false;
      break;
    case 'a':
      keys.left.pressed = false;
      idxToRemove = keys.lastPressedStk.indexOf('left');
      keys.lastPressedStk.splice(idxToRemove, 1);
      break;
    case 's':
      keys.down.pressed = false;
      break;
    case 'd':
      keys.right.pressed = false;
      idxToRemove = keys.lastPressedStk.indexOf('right');
      keys.lastPressedStk.splice(idxToRemove, 1);
      break;
  }

  switch (event.code) {
    case 'Space':
      keys.space.pressed = false;
      break;
  }
});

addEventListener('keydown', () => {
  var audio = new Audio('./audio/valorant-ascent-map-theme-music.mp3');
  audio.play();

}, { once: true });
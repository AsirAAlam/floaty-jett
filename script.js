const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');
canvas.width = 1280;
canvas.height = 720;

const platformImg = new Image();
platformImg.src = './images/ascent/ascent platform.png';
const backgroundImg = new Image();
backgroundImg.src = './images/ascent/ascent background compressed.png';
const foregroundImg = new Image();
foregroundImg.src = './images/ascent/ascent foreground compressed.png';
const spriteStand = new Image();
spriteStand.src = './images/jett-sprite.png';
let spriteAnimationSpeed = 15; // Larger value = slower animation

const gravity = 0.75;
const scrollXLimit = 6000;
var scrollX = 0;
const scrollYLimit = -1000;
var scrollY = 0;

var debug = false;

const scrollStart = {
  left: Math.floor(canvas.width / 8),
  right: Math.floor(canvas.width / 2),
  up: Math.floor(canvas.height / 7),
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
  lastPressedStk: new Array()
}

class Player {
  static playerJump = 20;

  // Must be divisible by scrollXLimit
  static playerSpeed = 10;

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
  }

  draw() {
    const spriteRowIndex = this.facing == 'right' ? 0 : 1;
    c.drawImage(spriteStand, Math.floor(this.frameIndex / spriteAnimationSpeed) * 128, spriteRowIndex * 128, 128, 128, this.pos.x, this.pos.y, this.width, this.height);
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
    } else {
      this.pos.y = canvas.height - this.height;
      this.vel.y = 0;
    }
  }
}

class Platform {
  static img = platformImg;

  constructor(x, y, isFloor = false) {
    this.pos = {
      x,
      y
    }
    this.isFloor = isFloor;
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
  new Platform(600, 400),
  new Platform(1200, 150),
  new Platform(2000, 150),
];

const background = new GenericObject(0, 0, backgroundImg);
const foreground = new GenericObject(0, 0, foregroundImg);

Platform.img.onload = () => {
  scrollStart.down = canvas.height - Platform.img.height - p.height;
  const numFloorPlatforms = 15;
  for (let i = 0; i < numFloorPlatforms; i++) {
    platforms.push(new Platform(i * Platform.img.width - 2 * i - 1, canvas.height - Platform.img.height, true));
  }
}

function animate() {
  // The offsets are there to only include the character and not the knives for platform collision
  const leftX = p.pos.x + (p.facing === 'right' ? 40 : 38);
  const rightX = p.pos.x + p.width - (p.facing === 'right' ? 38 : 40);
  
  // Platform collision
  platforms.forEach(platform => {
    if (p.pos.y + p.height <= platform.pos.y &&
      p.pos.y + p.height + p.vel.y >= platform.pos.y &&
      rightX >= platform.pos.x &&
      leftX <= platform.pos.x + Platform.img.width) {
      p.pos.y = platform.pos.y - p.height;
      p.vel.y = 0;

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
    }
  });

  p.update();

  // Platform / background scrolling
  const scrollXChange = p.pos.x > scrollStart.right ? p.pos.x - scrollStart.right :
    (p.pos.x < scrollStart.left ? p.pos.x - scrollStart.left : 0);

  if (scrollX + scrollXChange >= 0 && scrollX + scrollXChange <= scrollXLimit) {
    scrollX += scrollXChange;

    platforms.forEach(platform => platform.pos.x -= scrollXChange);
    foreground.pos.x -= scrollXChange / 2;
  }

  if (scrollX > 0 && scrollX < scrollXLimit) {
    p.pos.x -= scrollXChange;
  }

  p.pos.x = Math.max(p.pos.x, 0);
  p.pos.x = Math.min(p.pos.x, canvas.width - p.width);

  const scrollYChange = p.pos.y < scrollStart.up ? p.pos.y - scrollStart.up :
    (p.pos.y > scrollStart.down ? p.pos.y - scrollStart.down : 0);

  if (scrollY + scrollYChange <= 0 && scrollY + scrollYChange >= scrollYLimit) {
    scrollY += scrollYChange;

    platforms.forEach(platform => platform.pos.y -= scrollYChange);
    foreground.pos.y -= scrollYChange;
  }

  if (scrollY < 0 && scrollY > scrollYLimit) {
    p.pos.y -= scrollYChange;
  }

  const deb = document.getElementById('deb');
  deb.innerHTML = 'scrollY ' + scrollY + ' ' + 'scrollX ' + scrollX + ' ' + 'onFloor ' + p.onFloorPlatform + ' ' + 'onAirPlat ' + p.onAirPlatform;

  p.pos.y = Math.max(p.pos.y, 0);
  p.pos.y = Math.min(p.pos.y, canvas.height - p.height - Platform.img.height);

  // Clear objects from last frame
  c.fillStyle = 'white';
  c.fillRect(0, 0, canvas.width, canvas.height);

  // Draw objects from next frame
  background.draw();
  foreground.draw();
  platforms.forEach(platform => platform.draw());
  p.draw();
}

const fps = 60;
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
});

addEventListener('keydown', () => {
  document.getElementById('instructions').style.display = "none";
  var audio = new Audio('./audio/valorant-ascent-map-theme-music.mp3');
  audio.play();

}, { once: true });
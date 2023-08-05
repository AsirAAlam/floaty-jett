const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');
canvas.width = 1280;
canvas.height = 720;

const platformImg = new Image();
platformImg.src = './images/platform.png';
const playerImg = new Image();
playerImg.src = './images/jett-mcdonalds_256x256.png';
const backgroundImg = new Image();
backgroundImg.src = './images/background.png';
const hillsImg = new Image();
hillsImg.src = './images/hills.png';

const gravity = 0.2;
const scrollXLimit = 2000;
var scrollX = 0;

const scrollStart = {
  left: Math.floor(canvas.width / 8),
  right: Math.floor(canvas.width / 2),
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
  static img = playerImg;
  static playerJump = 10;
  static playerSpeed = 5;

  constructor() {
    this.pos = {
      x: scrollStart.left,
      y: 100
    }
    this.vel = {
      x: 0,
      y: 0
    }
    this.width = 50;
    this.height = 50;
    this.jumpCount = 0;
    this.downCount = 0;
    this.onAirPlatform = false;
  }

  draw() {
    c.drawImage(Player.img, this.pos.x, this.pos.y, this.width, this.height);
  }

  update() {
    // Horizontal movement
    if (keys.lastPressedStk[keys.lastPressedStk.length - 1] == 'right') {
      this.vel.x = Player.playerSpeed;
    } else if (keys.lastPressedStk[keys.lastPressedStk.length - 1] == 'left') {
      this.vel.x = -Player.playerSpeed;
    } else {
      this.vel.x = 0;
    }

    this.pos.x += this.vel.x;

    if (this.onAirPlatform && this.vel.y !== 0) {
      this.onAirPlatform = false;
      this.downCount = 0;
    }

    // Vertical movement + gravity
    if (this.pos.y + this.height + this.vel.y < canvas.height) {
      this.pos.y += this.vel.y;
      this.vel.y += gravity;
    } else {
      this.pos.y = canvas.height - this.height;
      this.vel.y = 0;
      this.jumpCount = 0;
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
  new Platform(1600, 450),
];

const background = new GenericObject(-1, -1, backgroundImg);
const hills = new GenericObject(0, 20, hillsImg);

Platform.img.onload = () => {
  for (let i = 0; i < 6; i++) {
    platforms.push(new Platform(i * Platform.img.width - 2 * i - 1, canvas.height - Platform.img.height, true));
  }
}

function animate() {
  requestAnimationFrame(animate);

  // Platform collision
  platforms.forEach(platform => {
    if (p.pos.y + p.height <= platform.pos.y &&
      p.pos.y + p.height + p.vel.y >= platform.pos.y &&
      p.pos.x + p.width >= platform.pos.x &&
      p.pos.x <= platform.pos.x + Platform.img.width) {
      p.pos.y = platform.pos.y - p.height;
      p.vel.y = 0;
      p.jumpCount = 0;

      // If this is an air platform and the player is not already on an air platform
      if (!platform.isFloor && !p.onAirPlatform) {
        p.onAirPlatform = true;
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
    hills.pos.x -= Math.floor(scrollXChange / 2);
  }

  if (scrollX > 0 && scrollX < scrollXLimit) {
    p.pos.x -= scrollXChange;
  }

  p.pos.x = Math.max(p.pos.x, 0);
  p.pos.x = Math.min(p.pos.x, canvas.width - p.width);

  // Clear objects from last frame
  c.fillStyle = 'white';
  c.fillRect(0, 0, canvas.width, canvas.height);

  // Draw objects from next frame
  background.draw();
  hills.draw();
  platforms.forEach(platform => platform.draw());
  p.draw();
}

addEventListener('keydown', (event) => {
  switch (event.key) {
    case 'w':
      if (!keys.up.pressed) {
        keys.up.pressed = true;

        if (p.jumpCount < 2) {
          p.vel.y = -Player.playerJump;
          p.jumpCount++;
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

animate();
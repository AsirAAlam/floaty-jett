const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

canvas.width = 1280;
canvas.height = 720;

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
}

class Player {
  static img = document.getElementById('jett');
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
  }

  draw() {
    c.drawImage(Player.img, this.pos.x, this.pos.y, this.width, this.height);
  }

  update() {
    // Horizontal movement
    if (keys.right.pressed) {
      this.vel.x = Player.playerSpeed;
    } else if (keys.left.pressed) {
      this.vel.x = -Player.playerSpeed;
    }

    if (keys.right.pressed === keys.left.pressed) {
      this.vel.x = 0;
    }

    this.pos.x += this.vel.x;

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
  static img = document.getElementById('platform');

  constructor(x, y) {
    this.pos = {
      x,
      y
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
  new Platform(600, 400),
  new Platform(1200, 150),
];
const background = new GenericObject(-1, -1, document.getElementById('background'));
const hills = new GenericObject(0, 20, document.getElementById('hills'));

for (let i = 0; i < 6; i++) {
  platforms.push(new Platform(i * Platform.img.width - 2 * i - 1, canvas.height - Platform.img.height));
}

function animate() {
  requestAnimationFrame(animate);

  // Platform collision
  platforms.forEach(platform => {
    if (p.pos.y + p.height < platform.pos.y &&
      p.pos.y + p.height + p.vel.y >= platform.pos.y &&
      p.pos.x + p.width >= platform.pos.x &&
      p.pos.x <= platform.pos.x + Platform.img.width) {
      p.vel.y = 0;
      p.jumpCount = 0;
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
      keys.left.pressed = true;
      break;
    case 's':
      keys.down.pressed = true;
      break;
    case 'd':
      keys.right.pressed = true;
      break;
  }
});

addEventListener('keyup', (event) => {
  switch (event.key) {
    case 'w':
      keys.up.pressed = false;
      break;
    case 'a':
      keys.left.pressed = false;
      break;
    case 's':
      keys.down.pressed = false;
      break;
    case 'd':
      keys.right.pressed = false;
      break;
  }
});

// Hide good luck gif on key pressdw
addEventListener('keydown', () => {
  document.getElementById('good-luck').style.opacity = 0;
}, { once: true });

animate();
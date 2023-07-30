const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

canvas.width = 1280;
canvas.height = 720;

const gravity = 0.2;
const playerSpeed = 5;
const playerJump = 10;

const scrollLimit = {
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

  constructor() {
    this.position = {
      x: scrollLimit.left,
      y: 100
    }
    this.velocity = {
      x: 0,
      y: 0
    }
    this.width = 50;
    this.height = 50;
    this.jumpCount = 0;
  }
  d
  draw() {
    c.drawImage(Player.img, this.position.x, this.position.y, this.width, this.height);
  }

  update() {
    // Horizontal movement
    if (keys.right.pressed) {
      this.velocity.x = playerSpeed;
    } else if (keys.left.pressed) {
      this.velocity.x = -playerSpeed;
    }

    if (keys.right.pressed === keys.left.pressed) {
      this.velocity.x = 0;
    }

    this.position.x += this.velocity.x;

    // Vertical movement + gravity
    if (this.position.y + this.height + this.velocity.y < canvas.height) {
      this.position.y += this.velocity.y;
      this.velocity.y += gravity;
    } else {
      this.position.y = canvas.height - this.height;
      this.velocity.y = 0;
      this.jumpCount = 0;
    }
  }
}

class Platform {
  static img = document.getElementById('platform');

  constructor(x, y) {
    this.position = {
      x,
      y
    }
  }

  draw() {
    c.drawImage(Platform.img, this.position.x, this.position.y);
  }
}

const p = new Player();
const platforms = [
  new Platform(-1, 600), 
  new Platform(580 - 3, 600), 
  new Platform(2 * 580 - 5, 600),
  new Platform(500, 300)
];

function animate() {
  requestAnimationFrame(animate);

  platforms.forEach(platform => {
    // Platform collision
    if (p.position.y + p.height < platform.position.y &&
      p.position.y + p.height + p.velocity.y >= platform.position.y &&
      p.position.x + p.width >= platform.position.x &&
      p.position.x <= platform.position.x + Platform.img.width) {
      p.velocity.y = 0;
      p.jumpCount = 0;
    }

  })

  p.update();

  // Platform / background scrolling
  const scrollX = p.position.x > scrollLimit.right ? p.position.x - scrollLimit.right :
    (p.position.x < scrollLimit.left ? p.position.x - scrollLimit.left : 0);

  platforms.forEach(platform => platform.position.x -= scrollX);
  p.position.x -= scrollX;

  // Clear objects from last frame
  c.fillStyle = 'white';
  c.fillRect(0, 0, canvas.width, canvas.height);

  // Draw objects from next frame
  platforms.forEach(platform => platform.draw());
  p.draw();
}

addEventListener('keydown', (event) => {
  switch (event.key) {
    case 'w':
      if (!keys.up.pressed) {
        keys.up.pressed = true;

        if (p.jumpCount < 2) {
          p.velocity.y = -playerJump;
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
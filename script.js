const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

canvas.width = innerWidth
canvas.height = innerHeight

const gravity = 0.2;
const playerSpeed = 5;
const playerJump = 10;

const keysPressed = {
  up: false,
  left: false,
  down: false,
  right: false
}

class Player {
  constructor() {
    this.position = {
      x: 100,
      y: 100
    }
    this.velocity = {
      x: 0,
      y: 0
    }
    this.width = 30;
    this.height = 30;
    this.jumpCount = 0;
  }

  draw() {
    c.fillStyle = 'red';
    c.fillRect(this.position.x, this.position.y, this.width, this.height);
  }

  update() {
    if (keysPressed.right) {
      this.velocity.x = playerSpeed;
    } else if (keysPressed.left) {
      this.velocity.x = -playerSpeed;
    } else {
      this.velocity.x = 0;
    }

    if (this.position.y + this.height + this.velocity.y < canvas.height) {
      this.position.y += this.velocity.y;
      this.velocity.y += gravity;
    } else {
      this.position.y = canvas.height - this.height;
      this.velocity.y = 0;
      this.jumpCount = 0;
    }

    this.position.x += this.velocity.x;

    // console.log(p.jumpCount, p.velocity.y);

    this.draw();
  }
}

const p = new Player();

function animate() {
  requestAnimationFrame(animate);

  c.clearRect(0, 0, canvas.width, canvas.height);
  p.update();
}

addEventListener('keydown', (event) => {
  switch (event.key) {
    case 'w':
      keysPressed.up = true;

      if (p.jumpCount < 2) {
        p.velocity.y -= playerJump;
        p.jumpCount++;
      }
      break;
    case 'a':
      keysPressed.left = true;
      break;
    case 's':
      keysPressed.down = true;
      break;
    case 'd':
      keysPressed.right = true;
      break;
  }
});

addEventListener('keyup', (event) => {
  switch (event.key) {
    case 'w':
      keysPressed.up = false;
      break;
    case 'a':
      keysPressed.left = false;
      break;
    case 's':
      keysPressed.down = false;
      break;
    case 'd':
      keysPressed.right = false;
      break;
  }
});

animate();
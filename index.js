class Machine {
    constructor() {
        this.startingRamp = new StartingRamp(120, 20, 40, 200);
        this.crane =  new Crane(0, 130, clawMachine);
        this.leftRamp = new Ramp(20, 200, 40, 250);
        this.rightRamp = new Ramp(220, 200, 40, 250);
        this.iOAmount = 0;
        this.nIOAmount = 0;
    }

    update(deltaTime) {
        if(frameCount > 20) {
            if(this.startingRamp.balls.length < 4) {
                const isBasketball = Math.random() > 0.5;
                this.startingRamp.addBall(new Ball(bId++, 0, 0, isBasketball ? basketball : soccer, isBasketball));
                frameCount = 0;
            }
        }
        if(!this.crane.ball && this.startingRamp.isBallReady()) {
            this.crane.moveToCenter();
        }

        if(!this.crane.ball && this.crane.isCentered && !this.crane.isMoving) {
            this.crane.takeBallFromRamp(this.startingRamp);
            const ball = this.crane.ball;
            if(ball && ball.iO) {
                this.crane.moveToLeft();
            }
            else if(ball && !ball.iO) {
                this.crane.moveToRight();
            }
        }

        if(this.crane.ball && !this.crane.isMoving && !this.crane.isCentered) {
            this.crane.dropBallOnRamp(this.crane.isLeft ? this.leftRamp : this.rightRamp);
            if(this.crane.isLeft) this.iOAmount++;
            else this.nIOAmount++;
            //console.log(this.iOAmount, this.nIOAmount);
        }


        this.leftRamp.update(deltaTime);
        this.rightRamp.update(deltaTime);

        this.startingRamp.update(deltaTime);
        this.crane.update(deltaTime);
        
        frameCount++;
    }

    draw(ctx) {
        this.leftRamp.draw(ctx);
        this.rightRamp.draw(ctx);

        this.startingRamp.draw(ctx);
        this.crane.draw(ctx);
    }
}

class Crane {
    constructor(x, y, image, width = 64, height = 64) {
        this.x = x; this.y = y; this.image = image;
        this.width = width; this.height = height;

        this.barX = x + 10; this.barY = y-30;
        this.barWidth = 270; this.barHeight = 30;

        this.ball = null;
        this.speed = 8;

        this.isMoving = false;
        this.nextPosition = '';
        this.isCentered = false;
        this.isLeft = true;
        this.isRight = false;
        this.dir = 0;
    }

    moveToCenter() {
        if(!this.isCentered) {
            this.nextPosition = 'center';
            this.isMoving = true;
            this.dir = this.isLeft ? 1 : -1;   
        }
    }

    moveToLeft() {
        if(!this.isLeft) {
            this.nextPosition = 'left';
            this.isMoving = true;   
            this.dir = -1;
        }
    }

    moveToRight() {
        if(!this.isRight) {
            this.nextPosition = 'right';
            this.isMoving = true;   
            this.dir = 1;
        }
    }

    takeBallFromRamp(ramp) {
        const ball = ramp.balls[0];
        ball.isInCrane = true;
        ball.isOnRamp = false;
        ball.ramp = null;
        this.ball = ball;
        ramp.balls = ramp.balls.slice(1, ramp.length);
    }

    dropBallOnRamp(ramp) {
        this.ball.isInCrane = false;
        ramp.addBall(this.ball);
        this.ball = null;
    }

    stopCrane(pos) {
        this.isCentered = pos === 'center';
        this.isLeft = pos === 'left';
        this.isRight === !this.isLeft && !this.isCentered;
        this.isMoving = false;
    }

    update(deltaTime) {
        if(this.isMoving) {
            const targetX = this.nextPosition === 'center' ? 108 : this.nextPosition === 'left' ? 0 : 220;
            if(this.dir === 1 && this.x < targetX) {
                this.x += this.speed;
            }
            else if(this.dir === -1 && this.x > targetX) {
                this.x -= this.speed;
            }
            else {
                this.x = targetX;
                this.stopCrane(this.nextPosition);
            }
        }
    }

    draw(ctx) {
        ctx.fillStyle = 'black';
        ctx.fillRect(this.barX, this.barY, this.barWidth, this.barHeight);

        ctx.fillStyle = !this.ball ? 'grey' : this.ball.iO ? 'green' : 'red';
        ctx.fillRect(this.barX + 20, this.barY-20, 20, 20);
        ctx.fillRect(this.barWidth - 40, this.barY-20, 20, 20);

        if(this.ball) {
            ctx.drawImage(this.ball.image, this.x + 15, this.y + 50, this.ball.width, this.ball.height);
        }
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
}

class StartingRamp {
    constructor(x, y, width, height) {
        this.x = x; this.y = y;
        this.width = width; this.height = height;
        this.balls = [];
    }

    isBallReady() {
        if(this.balls.length > 0) {
            const ball = this.balls[0];
            return ball.velocity[1] === 0;
        }   
        return false;
        
    }

    addBall(ball) {
        if(this.balls.length > 4) {
            this.balls = [];            
            return;
        }
        this.balls = [...this.balls, ball];
        ball.ramp = this;
        ball.isOnRamp = true;
        ball.setPos(this.x + (this.width - ball.width) / 2, this.y);
        ball.setSpeed([0, 10]);
    }

    update(deltaTime) {
        this.balls.forEach(ball => ball.update(deltaTime));
    }

    checkForCollision(ball) {
        const otherBalls = this.balls.filter(b => b !== ball);
        let coll = false;
        otherBalls.forEach(ob => {
            if(ball.y + ball.height + 10 > ob.y && ball.id > ob.id) coll = true;
        });
        return coll;
    }

    draw(ctx) {
        ctx.fillStyle = 'lightgrey';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        this.balls.forEach(ball => ball.draw(ctx));
    }
}

class Ramp {
    constructor(x, y, width, height) {
        this.x = x; this.y = y;
        this.width = width; this.height = height;
        this.balls = [];
    }

    addBall(ball) {
        if(this.balls.length > 4) {
            this.balls = [];            
            return;
        }
        this.balls = [...this.balls, ball];
        ball.ramp = this;
        ball.isOnRamp = true;
        ball.setPos(this.x + (this.width - ball.width) / 2, this.y);
    }

    update(deltaTime) {
        this.balls.forEach(ball => ball.update(deltaTime));
    }

    checkForCollision(ball) {
        const otherBalls = this.balls.filter(b => b !== ball);
        let coll = false;
        otherBalls.forEach(ob => {
            if(ball.y + ball.height + 10 > ob.y && ball.id > ob.id) coll = true;
        });
        return coll;
    }

    draw(ctx) {
        ctx.fillStyle = 'grey';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        this.balls.forEach(ball => ball.draw(ctx));
    }
}

class Ball {
    constructor(id, x, y, image, isIO, width = 32, height = 32) {
        this.id = id;
        this.x = x; this.y = y; this.image = image;
        this.width = width; this.height = height;
        this.velocity = [0, 0];
        this.iO = isIO;
        this.ramp = null;
        this.isOnRamp = false;
        this.isInCrane = false;
    }

    setPos(x, y) {
        this.x = x;
        this.y = y;
    }

    setSpeed(velo) {
        this.velocity[0] = velo[0];
        this.velocity[1] = velo[1];
    }

    update(deltaTime) {
        this.x += this.velocity[0];
        this.y += this.velocity[1];
        
        if(this.ramp) {
            if(this.y + this.height + 10 > this.ramp.y + this.ramp.height) {
                this.velocity[1] = 0;
            }
            else if(this.ramp.checkForCollision(this)) {
                this.velocity[1] = 0;
            }
            else {
                if(this.velocity[1] === 0) {
                    this.setSpeed([0, 10]);
                }
            }
        }
    }

    draw(ctx) {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
}

let bId = 0;

const width = 750;
const height = 500;

const canvas = document.getElementById('display');
const context = canvas.getContext('2d');

const basketball = document.getElementById('basketball');
const soccer = document.getElementById('soccer');
const clawMachine = document.getElementById('claw-machine');

let lastTime = 0;
let frameCount = 0;

const machine = new Machine();

const updateLoop = (timestamp) => {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    context.clearRect(0, 0, width, height);

    machine.update(deltaTime);
    machine.draw(context);

    window.requestAnimationFrame(updateLoop);
}

window.requestAnimationFrame(updateLoop);
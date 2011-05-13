//=============================================================================
// PONG
//=============================================================================

Pong = function(runner, config) { 
  this.init(runner, config);
};

Pong.Defaults = {
  wallWidth:    10,
  paddleWidth:  10,
  paddleHeight: 60,
  paddleSpeed:  2,     // should be able to cross court vertically   in 2 seconds
  ballSpeed:    4,     // should be able to cross court horizontally in 4 seconds, at starting speed ...
  ballAccel:    8,     // ... but accelerate as time passes
  ballRadius:   5,
  footprints:   (location.href.indexOf("footprints") > 0),
  predictions:  (location.href.indexOf("prediction") > 0)
}

Pong.Colors = {
  walls:           'white',
  ball:            'white',
  footprint:       '#1080F0',
  predictionGuess: 'yellow',
  predictionExact: 'red'
};

Pong.Images = [
  "images/0.png", 
  "images/1.png", 
  "images/2.png", 
  "images/3.png", 
  "images/4.png", 
  "images/5.png", 
  "images/6.png", 
  "images/7.png", 
  "images/8.png", 
  "images/9.png",
  "images/press1.png",
  "images/press2.png",
  "images/winner.png"
]

Pong.Levels = [
  {aiReaction: 0.2, aiError:  40}, // 0:  ai is losing by 8
  {aiReaction: 0.3, aiError:  50}, // 1:  ai is losing by 7
  {aiReaction: 0.4, aiError:  60}, // 2:  ai is losing by 6
  {aiReaction: 0.5, aiError:  70}, // 3:  ai is losing by 5
  {aiReaction: 0.6, aiError:  80}, // 4:  ai is losing by 4
  {aiReaction: 0.7, aiError:  90}, // 5:  ai is losing by 3
  {aiReaction: 0.8, aiError: 100}, // 6:  ai is losing by 2
  {aiReaction: 0.9, aiError: 110}, // 7:  ai is losing by 1
  {aiReaction: 1.0, aiError: 120}, // 8:  tie
  {aiReaction: 1.1, aiError: 130}, // 9:  ai is winning by 1
  {aiReaction: 1.2, aiError: 140}, // 10: ai is winning by 2
  {aiReaction: 1.3, aiError: 150}, // 11: ai is winning by 3
  {aiReaction: 1.4, aiError: 160}, // 12: ai is winning by 4
  {aiReaction: 1.5, aiError: 170}, // 13: ai is winning by 5
  {aiReaction: 1.6, aiError: 180}, // 14: ai is winning by 6
  {aiReaction: 1.7, aiError: 190}, // 15: ai is winning by 7
  {aiReaction: 1.8, aiError: 200}  // 16: ai is winning by 8
]

//-----------------------------------------------------------------------------

Pong.prototype = {

  init: function(runner, config) {
    Object.extend(this, config); // make all config properties available to this object
    this.runner      = runner;
    this.playing     = false;
    this.scores      = [0, 0];
    this.menu        = new Pong.Menu(this);
    this.court       = new Pong.Court(this);
    this.leftPaddle  = new Pong.Paddle(this);
    this.rightPaddle = new Pong.Paddle(this, true);
    this.ball        = new Pong.Ball(this);
    this.sounds      = new Pong.Sounds(this);
  },

  startDemo:         function() { this.start(0); },
  startSinglePlayer: function() { this.start(1); },
  startDoublePlayer: function() { this.start(2); },

  start: function(numPlayers) {
    if (!this.playing) {
      this.scores = [0, 0];
      this.playing = true;
      this.leftPaddle.setAuto(numPlayers < 1, this.level(0));
      this.rightPaddle.setAuto(numPlayers < 2, this.level(1));
      this.ball.reset();
      this.runner.hideCursor();
    }
  },

  stop: function(ask) {
    if (this.playing) {
      if (!ask || this.runner.confirm('Abandon game in progress ?')) {
        this.playing = false;
        this.leftPaddle.setAuto(false);
        this.rightPaddle.setAuto(false);
        this.runner.showCursor();
      }
    }
  },

  level: function(playerNo) {
    return 8 + (this.scores[playerNo] - this.scores[playerNo ? 0 : 1]);
  },

  goal: function(playerNo) {
    this.sounds.goal();
    this.scores[playerNo] += 1;
    if (this.scores[playerNo] == 9) {
      this.menu.declareWinner(playerNo);
      this.stop();
    }
    else {
      this.ball.reset(playerNo);
      this.leftPaddle.setLevel(this.level(0));
      this.rightPaddle.setLevel(this.level(1));
    }
  },

  update: function(dt) {
    this.leftPaddle.update(dt, this.ball);
    this.rightPaddle.update(dt, this.ball);
    if (this.playing) {
      var dx = this.ball.dx;
      var dy = this.ball.dy;
      this.ball.update(dt, this.leftPaddle, this.rightPaddle);
      if (this.ball.dx < 0 && dx > 0)
        this.sounds.ping();
      else if (this.ball.dx > 0 && dx < 0)
        this.sounds.pong();
      else if (this.ball.dy * dy < 0)
        this.sounds.wall();

      if (this.ball.left > this.width)
        this.goal(0);
      else if (this.ball.right < 0)
        this.goal(1);
    }
  },

  draw: function(ctx) {
    this.court.draw(ctx, this.scores[0], this.scores[1]);
    this.leftPaddle.draw(ctx);
    this.rightPaddle.draw(ctx);
    if (this.playing)
      this.ball.draw(ctx);
    else
      this.menu.draw(ctx);
  },

  onkeydown: function(keyCode) {
    switch(keyCode) {
      case GameRunner.KEY.ZERO: this.startDemo();            break;
      case GameRunner.KEY.ONE:  this.startSinglePlayer();    break;
      case GameRunner.KEY.TWO:  this.startDoublePlayer();    break;
      case GameRunner.KEY.ESC:  this.stop(true);             break;
      case GameRunner.KEY.Q:    if (!this.leftPaddle.auto)  this.leftPaddle.moveUp();    break;
      case GameRunner.KEY.A:    if (!this.leftPaddle.auto)  this.leftPaddle.moveDown();  break;
      case GameRunner.KEY.P:    if (!this.rightPaddle.auto) this.rightPaddle.moveUp();   break;
      case GameRunner.KEY.L:    if (!this.rightPaddle.auto) this.rightPaddle.moveDown(); break;
    }
  },

  onkeyup: function(keyCode) {
    switch(keyCode) {
      case GameRunner.KEY.Q: if (!this.leftPaddle.auto)  this.leftPaddle.stopMovingUp();    break;
      case GameRunner.KEY.A: if (!this.leftPaddle.auto)  this.leftPaddle.stopMovingDown();  break;
      case GameRunner.KEY.P: if (!this.rightPaddle.auto) this.rightPaddle.stopMovingUp();   break;
      case GameRunner.KEY.L: if (!this.rightPaddle.auto) this.rightPaddle.stopMovingDown(); break;
    }
  }

};

//=============================================================================
// MENU
//=============================================================================
Pong.Menu = function(pong) {
  var press1 = pong.images["images/press1.png"];
  var press2 = pong.images["images/press2.png"];
  var winner = pong.images["images/winner.png"];
  var number = pong.images["images/0.png"];
  this.press1  = { image: press1, x: 10,                                             y: pong.wallWidth                };
  this.press2  = { image: press2, x: (pong.width - press2.width - 10),               y: pong.wallWidth                };
  this.winner1 = { image: winner, x: (pong.width/2) - winner.width - pong.wallWidth, y: pong.wallWidth + number.width };
  this.winner2 = { image: winner, x: (pong.width/2)                + pong.wallWidth, y: pong.wallWidth + number.width };
};

Pong.Menu.prototype = {
  declareWinner: function(playerNo) {
    this.winner = playerNo;
  },

  draw: function(ctx) {
    ctx.drawImage(this.press1.image, this.press1.x, this.press1.y);
    ctx.drawImage(this.press2.image, this.press2.x, this.press2.y);
    if (this.winner == 0)
      ctx.drawImage(this.winner1.image, this.winner1.x, this.winner1.y);
    else if (this.winner == 1)
      ctx.drawImage(this.winner2.image, this.winner2.x, this.winner2.y);
  }
};

//=============================================================================
// SOUNDS
//=============================================================================

Pong.Sounds = function(pong) {
  this.supported = false; //GameRunner.ua.hasAudio;
  if (this.supported) {
    this.files = {
      ping: GameRunner.createAudio("sounds/ping.wav"),
      pong: GameRunner.createAudio("sounds/pong.wav"),
      wall: GameRunner.createAudio("sounds/wall.wav"),
      goal: GameRunner.createAudio("sounds/goal.wav")
    };
  }
};

Pong.Sounds.prototype = {
  play: function(name) {
    if (this.supported && this.files[name])
      this.files[name].play();
  },

  ping: function() { this.play('ping'); },
  pong: function() { this.play('pong'); },
  wall: function() { /*this.play('wall');*/ },
  goal: function() { this.play('goal'); }
};

//=============================================================================
// COURT
//=============================================================================

Pong.Court = function(pong) {
  var w = pong.width;
  var h = pong.height;
  var ww = pong.wallWidth;

  this.numbers = [];
  for(var n = 0 ; n < 10 ; n++)
    this.numbers[n] = pong.images["images/" + n + ".png"]

  this.walls = [];
  this.walls.push({x: 0, y: 0,      width: w, height: ww});
  this.walls.push({x: 0, y: h - ww, width: w, height: ww});
  var nMax = (h / (ww*2));
  for(var n = 0 ; n < nMax ; n++) {
    this.walls.push({x: (w / 2) - (ww / 2), 
                     y: (ww / 2) + (ww * 2 * n), 
                     width: ww, height: ww});
  }
  this.score1 = {x: (w/2) - this.numbers[0].width - ww, y: ww};
  this.score2 = {x: (w/2) + ww,                         y: ww};
};

Pong.Court.prototype = {
  draw: function(ctx, scorePlayer1, scorePlayer2) {
    ctx.fillStyle = Pong.Colors.walls;
    ctx.drawImage(this.numbers[scorePlayer1], this.score1.x, this.score1.y);
    ctx.drawImage(this.numbers[scorePlayer2], this.score2.x, this.score2.y);
    for(var n = 0 ; n < this.walls.length ; n++)
      ctx.fillRect(this.walls[n].x, this.walls[n].y, this.walls[n].width, this.walls[n].height);
  }
};

//=============================================================================
// PADDLE
//=============================================================================
Pong.Paddle = function(pong, rhs) {
  this.pong   = pong;
  this.width  = pong.paddleWidth;
  this.height = pong.paddleHeight;
  this.minY   = pong.wallWidth;
  this.maxY   = pong.height - pong.wallWidth - this.height;
  this.speed  = (this.maxY - this.minY) / pong.paddleSpeed;
  this.setpos(rhs ? pong.width - this.width : 0, this.minY + (this.maxY - this.minY)/2);
  this.setdir(0);
};

Pong.Paddle.prototype = {

  setpos: function(x, y) {
    this.x      = x;
    this.y      = y;
    this.left   = this.x;
    this.right  = this.left + this.width;
    this.top    = this.y;
    this.bottom = this.y + this.height;
  },

  setdir: function(dy) {
    this.up   = (dy < 0 ? -dy : 0);
    this.down = (dy > 0 ?  dy : 0);
  },

  setAuto: function(on, level) {
    if (on && !this.auto) {
      this.auto = true;
      this.setLevel(level);
    }
    else if (!on && this.auto) {
      this.auto = false;
      this.setdir(0);
    }
  },

  setLevel: function(level) {
    if (this.auto)
      this.level = Pong.Levels[level];
  },

  update: function(dt, ball) {
    if (this.auto)
      this.ai(dt, ball);

    var amount = this.down - this.up;
    if (amount != 0) {
      var y = this.y + (amount * dt * this.speed);
      if (y < this.minY)
        y = this.minY;
      else if (y > this.maxY)
        y = this.maxY;
      this.setpos(this.x, y);
    }
  },

  ai: function(dt, ball) {
    if (((ball.x < this.left) && (ball.dx < 0)) ||
        ((ball.x > this.right) && (ball.dx > 0))) {
      this.stopMovingUp();
      this.stopMovingDown();
      return;
    }

    this.predict(ball, dt);

    if (this.prediction) {
      if (this.prediction.y < (this.top + this.height/2 - 5)) {
        this.stopMovingDown();
        this.moveUp();
      }
      else if (this.prediction.y > (this.bottom - this.height/2 + 5)) {
        this.stopMovingUp();
        this.moveDown();
      }
      else {
        this.stopMovingUp();
        this.stopMovingDown();
      }
    }
  },

  predict: function(ball, dt) {
    // only re-predict if the ball changed direction, or its been some amount of time since last prediction
    if (this.prediction &&
        ((this.prediction.dx * ball.dx) > 0) &&
        ((this.prediction.dy * ball.dy) > 0) &&
        (this.prediction.since < this.level.aiReaction)) {
      this.prediction.since += dt;
      return;
    }

    var pt  = Pong.Helper.ballIntercept(ball, {left: this.left, right: this.right, top: -10000, bottom: 10000}, ball.dx * 10, ball.dy * 10);
    if (pt) {
      var t = this.minY + ball.radius;
      var b = this.maxY + this.height - ball.radius;

      while ((pt.y < t) || (pt.y > b)) {
        if (pt.y < t) {
          pt.y = t + (t - pt.y);
        }
        else if (pt.y > b) {
          pt.y = t + (b - t) - (pt.y - b);
        }
      }
      this.prediction = pt;
    }
    else {
      this.prediction = null;
    }

    if (this.prediction) {
      this.prediction.since = 0;
      this.prediction.dx = ball.dx;
      this.prediction.dy = ball.dy;
      this.prediction.exactX = this.prediction.x;
      this.prediction.exactY = this.prediction.y;
      var closeness = (ball.dx < 0 ? ball.x - this.right : this.left - ball.x) / this.pong.width;
      var error = this.level.aiError * closeness;
      this.prediction.y = this.prediction.y + GameRunner.random(-error, error);
    }
  },

  draw: function(ctx) {
    ctx.fillStyle = Pong.Colors.walls;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    if (this.prediction && this.pong.predictions) {
      ctx.strokeStyle = Pong.Colors.predictionExact;
      ctx.beginPath();
      ctx.arc(this.prediction.x, this.prediction.exactY, 5, 0, 2*Math.PI, true);
      ctx.stroke();
      ctx.closePath();
      ctx.strokeStyle = Pong.Colors.predictionGuess;
      ctx.beginPath();
      ctx.arc(this.prediction.x, this.prediction.y, 5, 0, 2*Math.PI, true);
      ctx.stroke();
      ctx.closePath();
    }
  },

  moveUp:         function() { this.up   = 1; },
  moveDown:       function() { this.down = 1; },
  stopMovingUp:   function() { this.up   = 0; },
  stopMovingDown: function() { this.down = 0; }
};

//=============================================================================
// BALL
//=============================================================================

Pong.Ball = function(pong) {
  this.pong    = pong;
  this.radius  = pong.ballRadius;
  this.minX    = this.radius;
  this.maxX    = pong.width - this.radius;
  this.minY    = pong.wallWidth + this.radius;
  this.maxY    = pong.height - pong.wallWidth - this.radius;
  this.speed   = (this.maxX - this.minX) / pong.ballSpeed;
  this.accel   = pong.ballAccel;
};

Pong.Ball.prototype = {

  reset: function(playerNo) {
    this.footprints = [];
    this.setpos(playerNo == 1 ?   this.maxX : this.minX,  GameRunner.random(this.minY, this.maxY));
    this.setdir(playerNo == 1 ? -this.speed : this.speed, this.speed);
  },

  setpos: function(x, y) {
    this.x      = x;
    this.y      = y;
    this.left   = this.x - this.radius;
    this.top    = this.y - this.radius;
    this.right  = this.x + this.radius;
    this.bottom = this.y + this.radius;
  },

  setdir: function(dx, dy) {
    this.dx = dx;
    this.dy = dy;
  },

  footprint: function() {
    if (this.pong.footprints) {
      this.footprints.push({x: this.x, y: this.y});
      if (this.footprints.length > 50)
        this.footprints.shift();
    }
  },

  update: function(dt, leftPaddle, rightPaddle) {

    pos = Pong.Helper.accelerate(this.x, this.y, this.dx, this.dy, this.accel, dt);

    if ((pos.dy > 0) && (pos.y > this.maxY)) {
      pos.y = this.maxY;
      pos.dy = -pos.dy;
    }
    else if ((pos.dy < 0) && (pos.y < this.minY)) {
      pos.y = this.minY;
      pos.dy = -pos.dy;
    }

    var pt;
    if (pos.dx < 0)
      pt = Pong.Helper.ballIntercept(this, leftPaddle, pos.nx, pos.ny);
    else if (pos.dx > 0)
      pt = Pong.Helper.ballIntercept(this, rightPaddle, pos.nx, pos.ny);

    if (pt) {
      switch(pt.d) {
        case 'left':
        case 'right':
          pos.x = pt.x;
          pos.dx = -pos.dx;
          break;
        case 'top':
        case 'bottom':
          pos.y = pt.y;
          pos.dy = -pos.dy;
          break;
      }
    }

    this.setpos(pos.x,  pos.y);
    this.setdir(pos.dx, pos.dy);
    this.footprint();
  },

  draw: function(ctx) {
    var w = h = this.radius * 2;
    ctx.fillStyle = Pong.Colors.ball;
    ctx.fillRect(this.x - this.radius, this.y - this.radius, w, h);
    if (this.pong.footprints) {
      var max = this.footprints.length;
      ctx.strokeStyle = Pong.Colors.footprint;
      for(var n = 0 ; n < max ; n++)
        ctx.strokeRect(this.footprints[n].x - this.radius, this.footprints[n].y - this.radius, w, h);
    }
  }
};

//=============================================================================
// HELPER
//=============================================================================

Pong.Helper = {

  accelerate: function(x, y, dx, dy, accel, dt) {
    var x2  = x + (dt * dx) + (accel * dt * dt * 0.5);
    var y2  = y + (dt * dy) + (accel * dt * dt * 0.5);
    var dx2 = dx + (accel * dt) * (dx > 0 ? 1 : -1);
    var dy2 = dy + (accel * dt) * (dy > 0 ? 1 : -1);
    return { nx: (x2-x), ny: (y2-y), x: x2, y: y2, dx: dx2, dy: dy2 };
  },

  intercept: function(x1, y1, x2, y2, x3, y3, x4, y4, d) {
    var denom = ((y4-y3) * (x2-x1)) - ((x4-x3) * (y2-y1));
    if (denom != 0) {
      var ua = (((x4-x3) * (y1-y3)) - ((y4-y3) * (x1-x3))) / denom;
      if ((ua >= 0) && (ua <= 1)) {
        var ub = (((x2-x1) * (y1-y3)) - ((y2-y1) * (x1-x3))) / denom;
        if ((ub >= 0) && (ub <= 1)) {
          var x = x1 + (ua * (x2-x1));
          var y = y1 + (ua * (y2-y1));
          return { x: x, y: y, d: d};
        }
      }
    }
    return null;
  },

  ballIntercept: function(ball, rect, nx, ny) {
    var pt;
    if (nx < 0) {
      pt = Pong.Helper.intercept(ball.x, ball.y, ball.x + nx, ball.y + ny, 
                                 rect.right  + ball.radius, 
                                 rect.top    - ball.radius, 
                                 rect.right  + ball.radius, 
                                 rect.bottom + ball.radius, 
                                 "right");
    }
    else if (nx > 0) {
      pt = Pong.Helper.intercept(ball.x, ball.y, ball.x + nx, ball.y + ny, 
                                 rect.left   - ball.radius, 
                                 rect.top    - ball.radius, 
                                 rect.left   - ball.radius, 
                                 rect.bottom + ball.radius,
                                 "left");
    }
    if (!pt) {
      if (ny < 0) {
        pt = Pong.Helper.intercept(ball.x, ball.y, ball.x + nx, ball.y + ny, 
                                   rect.left   - ball.radius, 
                                   rect.bottom + ball.radius, 
                                   rect.right  + ball.radius, 
                                   rect.bottom + ball.radius,
                                   "bottom");
      }
      else if (ny > 0) {
        pt = Pong.Helper.intercept(ball.x, ball.y, ball.x + nx, ball.y + ny, 
                                   rect.left   - ball.radius, 
                                   rect.top    - ball.radius, 
                                   rect.right  + ball.radius, 
                                   rect.top    - ball.radius,
                                   "top");
      }
    }
    return pt;
  }

};

//=============================================================================
function MovementSystem() {
  this.map = null;
  makr.IteratingSystem.call(this);

  this.registerComponent(CompTypes.Position);
  this.registerComponent(CompTypes.Velocity);
};
makr.inherits(MovementSystem, makr.IteratingSystem);
MovementSystem.prototype.setMap = function (map) {
    this.map = map;
};
MovementSystem.prototype.process = function(entity, elapsed) {
    var pos = entity.get(CompTypes.Position),
        vel = entity.get(CompTypes.Velocity),
        map = this.map;

    var xo = Math.sin(vel.dir) * vel.speed * elapsed,
        yo = Math.cos(vel.dir) * vel.speed * elapsed;

    var cellX = (pos.x + xo) / map.size | 0,
        cellY = (pos.y + yo) / map.size | 0;

    if (map.cells[cellY][cellX] !== 0) {
        xo = 0;
        yo = 0;
        vel.dir = Math.random() * (Math.PI * 2);
    }

    pos.x += xo;
    pos.y += yo;
};

function RenderingSystem() {
    makr.IteratingSystem.call(this);

    this.registerComponent(CompTypes.Position);
    this.registerComponent(CompTypes.Colour);
};
makr.inherits(RenderingSystem, makr.IteratingSystem);

RenderingSystem.prototype.onRegistered = function() {
  this.canvas = document.getElementById('board');
  this.ctx = this.canvas.getContext('2d');
};
RenderingSystem.prototype.onBegin = function() {
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
};

RenderingSystem.prototype.process = function(entity, elapsed) {
  var pos = entity.get(CompTypes.Position);
  var color = entity.get(CompTypes.Colour).colour;

  var c = this.ctx;

  c.fillStyle = color;
  c.fillRect(pos.x | 0, pos.y | 0, 20, 20);
};

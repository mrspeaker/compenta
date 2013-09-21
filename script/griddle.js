function Map(size, cells) {
  this.size = size;
  this.cells = cells;
};

function run() {
  var time = Date.now();
  var gameLoop = function() {
    var now = Date.now();
    world.update((now - time) / 1000);
    time = now;

    requestAnimationFrame(gameLoop);
  };

  // Start the game loop
  gameLoop();
};

var map = new Map(24, [
  [1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1]
]);
movementSystem.setMap(map);

prefabs.make();
prefabs.make();
prefabs.make();
prefabs.make();

run();
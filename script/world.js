var world = new makr.World(),
    movementSystem = new MovementSystem();

// Register systems
world.registerSystem(movementSystem);
world.registerSystem(new RenderingSystem());

/**
 * @module makr
 */
var makr = makr || {
  config: {
    MAX_COMPONENTS: 32,
    MAX_SYSTEMS: 32
  }
};

if (typeof module !== 'undefined') {
  module.exports = makr;
}

makr.inherits = function(ctor, superCtor) {
  ctor.prototype = Object.create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
};

/**
 * @class BitSet
 * @constructor
 * @param {Uint} size
 */
makr.BitSet = function(size) {
  /**
   * @private
   * @property {Uint} _length
   */
  var length = this._length = Math.ceil(size / 32);

  /**
   * @private
   * @property {Array} _words
   */
  var words = this._words = new Array(length);

  // Create empty words
  while (length--) {
    words[length] = 0;
  }
};

makr.BitSet.prototype = {
  /**
   * @method set
   * @param {Uint} index
   * @param {Boolean} value
   */
  set: function(index, value) {
    var wordOffset = index / 32 | 0;
    var bitOffset = index - wordOffset * 32;

    if (value) {
      this._words[wordOffset] |= 1 << bitOffset;
    } else {
      this._words[wordOffset] &= ~(1 << bitOffset);
    }
  },
  /**
   * @method get
   * @param  {Uint} index
   * @return {Boolean}
   */
  get: function(index) {
    var wordOffset = index / 32 | 0;
    var bitOffset = index - wordOffset * 32;

    return !!(this._words[wordOffset] & (1 << bitOffset));
  },
  /**
   * @method reset
   */
  reset: function() {
    var words = this._words;
    var i = this._length;

    while (i--) {
      words[i] = 0;
    }
  },
  /**
   * @method contains
   * @param  {BitSet} other
   * @return {Boolean}
   */
  contains: function(other) {
    var words = this._words;
    var i = this._length;

    if (i != other._length) {
      return false;
    }

    while (i--) {
      if ((words[i] & other._words[i]) != other._words[i]) {
        return false;
      }
    }

    return true;
  }
};

/**
 * @class FastBitSet
 * @constructor
 */
makr.FastBitSet = function() {
  /**
   * @private
   * @property {Uint} _bits
   */
  this._bits = 0;
};

makr.FastBitSet.prototype = {
  /**
   * @method set
   * @param {Uint} index
   * @param {Boolean} value
   */
  set: function(index, value) {
    if (value) {
      this._bits |= 1 << index;
    } else {
      this._bits &= ~(1 << index);
    }
  },
  /**
   * @method get
   * @param  {Uint} index
   * @return {Boolean}
   */
  get: function(index) {
    return !!(this._bits & (1 << index));
  },
  /**
   * @method reset
   */
  reset: function() {
    this._bits = 0;
  },
  /**
   * @method contains
   * @param  {FastBitSet} other
   * @return {Boolean}
   */
  contains: function(other) {
    return (this._bits & other._bits) == other._bits;
  }
};

/**
 * @final
 * @class Entity
 * @constructor
 */
makr.Entity = function(world, id) {
  /**
   * @private
   * @property {Uint} _id
   */
  this._id = id;

  /**
   * @private
   * @property {World} _world
   */
  this._world = world;

  /**
   * @private
   * @property {Boolean} _alive
   */
  this._alive = true;

  /**
   * @private
   * @property {Boolean} _waitingForRefresh
   */
  this._waitingForRefresh = false;

  /**
   * @private
   * @property {Boolean} _waitingForRemoval
   */
  this._waitingForRemoval = false;

  /**
   * @private
   * @property {BitSet} _componentMask
   */
  this._componentMask = makr.config.MAX_COMPONENTS <= 32 ? new makr.FastBitSet() : new makr.BitSet(makr.config.MAX_COMPONENTS);

  /**
   * @private
   * @property {BitSet} _systemMask
   */
  this._systemMask = makr.config.MAX_SYSTEMS <= 32 ? new makr.FastBitSet() : new makr.BitSet(makr.config.MAX_SYSTEMS);
};

makr.Entity.prototype = {
  /**
   * @method get
   * @param  {Uint} type
   * @return {Object}
   */
  get: function(type) {
    return this._world._getComponent(this, type);
  },
  /**
   * @method add
   * @param {Object} component
   * @param {Uint} type
   */
  add: function(component, type) {
    this._world._addComponent(this, component, type);
  },
  /**
   * @method remove
   * @param {Uint} type
   */
  remove: function(type) {
    this._world._removeComponent(this, type);
  },
  /**
   * @method clear
   */
  clear: function() {
    this._world._removeComponents(this);
  },
  /**
   * @method kill
   */
  kill: function() {
    this._world.kill(this);
  },
  /**
   * @method refresh
   */
  refresh: function() {
    this._world.refresh(this);
  }
};

/**
 * @property {Uint} id
 */
Object.defineProperty(makr.Entity.prototype, 'id', {
  get: function() {
    return this._id;
  }
});

/**
 * @property {Boolean} alive
 */
Object.defineProperty(makr.Entity.prototype, 'alive', {
  get: function() {
    return this._alive;
  }
});

/**
 * The primary instance for the framework. It contains all the managers.
 * You must use this to create, delete and retrieve entities.
 *
 * @final
 * @class World
 * @constructor
 */
makr.World = function() {
  /**
   * @private
   * @property {System[]} _systems
   */
  this._systems = [];

  /**
   * @private
   * @property {Uint} _nextEntityID
   */
  this._nextEntityID = 0;

  /**
   * @private
   * @property {Entity[]} _alive
   */
  this._alive = [];

  /**
   * @private
   * @property {Entity[]} _dead
   */
  this._dead = [];

  /**
   * @private
   * @property {Entity[]} _removed
   */
  this._removed = [];

  /**
   * @private
   * @property {Entity[]} _refreshed
   */
  this._refreshed = [];

  /**
   * @private
   * @property {Object[][]} _componentBags
   */
  this._componentBags = [];
};

makr.World.prototype = {
  /**
   * Registers the specified system.
   *
   * @method registerSystem
   * @param {System} system
   */
  registerSystem: function(system) {
    if (this._systems.indexOf(system) >= 0) {
      throw "Cannot register a system twice";
    }

    this._systems.push(system);

    system.world = this;
    system.onRegistered();
  },
  /**
   * Creates a new entity.
   *
   * @method create
   * @return {Entity}
   */
  create: function() {
    var entity;
    if (this._dead.length > 0) {
      // Revive entity
      entity = this._dead.pop();
      entity._alive = true;
    } else {
      entity = new makr.Entity(this, this._nextEntityID++);
    }

    this._alive.push(entity);
    return entity;
  },
  /**
   * Kills the specified entity.
   *
   * @method kill
   * @param {Entity} entity
   */
  kill: function(entity) {
    if (!entity._waitingForRemoval) {
      entity._waitingForRemoval = true;
      this._removed.push(entity);
    }
  },
  /**
   * Queues the entity to be refreshed.
   *
   * @method refresh
   * @param {Entity} entity
   */
  refresh: function(entity) {
    if (!entity._waitingForRefresh) {
      entity._waitingForRefresh = true;
      this._refreshed.push(entity);
    }
  },
  /**
   * Updates all systems.
   *
   * @method update
   * @param {Float} elapsed
   */
  update: function(elapsed) {
    // Process entities
    this.loopStart();

    var systems = this._systems;
    var i = 0;
    var n = systems.length;

    for (; i < n; i++) {
      systems[i].update(elapsed);
    }
  },
  /**
   * Processes all queued entities.
   *
   * @method loopStart
   */
  loopStart: function() {
    var i, entities;

    // Process entities queued for removal
    for (entities = this._removed, i = entities.length; i--;) {
      this._removeEntity(entities[i]);
    }

    entities.length = 0;

    // Process entities queded for refresh
    for (entities = this._refreshed, i = entities.length; i--;) {
      this._refreshEntity(entities[i]);
    }

    entities.length = 0;
  },
  /**
   * @private
   * @method _refreshEntity
   * @param {Entity} entity
   */
  _refreshEntity: function(entity) {
    // Unset refresh flag
    entity._waitingForRefresh = false;

    var systems = this._systems;
    var i = 0;
    var n = systems.length;

    for (; i < n; i++) {
      var contains = entity._systemMask.get(i);
      var interested = entity._componentMask.contains(systems[i]._componentMask);

      if (contains && !interested) {
        // Remove entity from the system
        systems[i]._removeEntity(entity);
        entity._systemMask.set(i, 0);
      } else if (!contains && interested) {
        // Add entity to the system
        systems[i]._addEntity(entity);
        entity._systemMask.set(i, 1);
      }
    }
  },
  /**
   * @private
   * @method _removeEntity
   * @param {Entity} entity
   */
  _removeEntity: function(entity) {
    if (entity._alive) {
      // Unset removal flag
      entity._waitingForRemoval = false;

      // Murder the entity!
      entity._alive = false;

      // Remove from alive entities by swapping with the last entity
      this._alive[this._alive.indexOf(entity)] = this._alive[this._alive.length - 1];
      this._alive.pop();

      // Add to dead entities
      this._dead.push(entity);

      // Reset component mask
      entity._componentMask.reset();

      // Refresh entity
      this._refreshEntity(entity);
    }
  },
  /**
   * @private
   * @method _getComponent
   * @param  {Entity} entity
   * @param  {Uint} type
   * @return {Object}
   */
  _getComponent: function(entity, type) {
    if (entity._componentMask.get(type)) {
      return this._componentBags[entity._id][type];
    }

    return null;
  },
  /**
   * @private
   * @method _addComponent
   * @param {Entity} entity
   * @param {Object} component
   * @param {type} type
   */
  _addComponent: function(entity, component, type) {
    entity._componentMask.set(type, 1);

    this._componentBags[entity._id] || (this._componentBags[entity._id] = []);
    this._componentBags[entity._id][type] = component;

    this.refresh(entity);
  },
  /**
   * @private
   * @method _removeComponent
   * @param {Entity} entity
   * @param {Uint} type
   */
  _removeComponent: function(entity, type) {
    entity._componentMask.set(type, 0);

    this.refresh(entity);
  },
  /**
   * @private
   * @method _removeComponents
   * @param {Entity} entity
   */
  _removeComponents: function(entity) {
    entity._componentMask.reset();
  }
};

/**
 * A system that processes entities.
 *
 * @class System
 * @constructor
 */
makr.System = function() {
  /**
   * @private
   * @property {BitSet} _componentMask
   */
  this._componentMask = makr.config.MAX_COMPONENTS <= 32 ? new makr.FastBitSet() : new makr.BitSet(makr.config.MAX_COMPONENTS);

  /**
   * @private
   * @property {Entity[]} _entities
   */
  this._entities = [];

  /**
   * @private
   * @property {World} _world
   */
  this._world = null;

  /**
   * @property {Boolean} enabled
   */
  this.enabled = true;
};

makr.System.prototype = {
  /**
   * @final
   * @method registerComponent
   * @param {Uint} type
   */
  registerComponent: function(type) {
    this._componentMask.set(type, 1);
  },
  /**
   * @final
   * @method update
   * @param {Float} elapsed
   */
  update: function(elapsed) {
    if (this.enabled) {
      this.onBegin();
      this.processEntities(this._entities, elapsed);
      this.onEnd();
    }
  },
  /**
   * @method processEntities
   * @param {Entity[]} entities
   * @param {Float} elapsed
   */
  processEntities: function(entities, elapsed) {},
  /**
   * @method onRegistered
   */
  onRegistered: function() {},
  /**
   * @method onBegin
   */
  onBegin: function() {},
  /**
   * Called after the end of processing.
   *
   * @method onEnd
   */
  onEnd: function() {},
  /**
   * Called when an entity is added to this system
   *
   * @method onAdded
   * @param {Entity} entity
   */
  onAdded: function(entity) {},
  /**
   * Called when an entity is removed from this system
   *
   * @method onRemoved
   * @param {Entity} entity
   */
  onRemoved: function(entity) {},
  /**
   * @private
   * @method _addEntity
   * @param {Entity} entity
   */
  _addEntity: function(entity) {
    var entities = this._entities;
    if (entities.indexOf(entity) < 0) {
      entities.push(entity);
      this.onAdded(entity);
    }
  },
  /**
   * @private
   * @method _removeEntity
   * @param {Entity} entity
   */
  _removeEntity: function(entity) {
    var entities = this._entities;
    var i = entities.indexOf(entity);
    if (i >= 0) {
      entities[i] = entities[entities.length - 1];
      entities.pop();
      this.onRemoved(entity);
    }
  }
};

/**
 * @property {Boolean} world
 */
Object.defineProperty(makr.System.prototype, 'world', {
  get: function() {
    return this._world;
  }
});

/**
 * @class IteratingSystem
 * @extends {System}
 * @constructor
 */
makr.IteratingSystem = function() {
  makr.System.call(this);
};

makr.inherits(makr.IteratingSystem, makr.System);

makr.IteratingSystem.prototype.processEntities = function(entities, elapsed) {
  var i = 0;
  var n = entities.length;

  for (i = 0; i < n; i++) {
    this.process(entities[i], elapsed);
  }
};

/**
 * @method process
 * @param {Entity} entity
 * @param {Float} elapsed
 */
makr.IteratingSystem.prototype.process = function(entity, elapsed) {};

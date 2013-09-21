(function () {

    "use strict";

    function Position(x, y) {
        this.x = x || 0;
        this.y = y || 0;
    };

    function Colour(col) {
        this.colour = col || "red";
    };

    function Velocity(dir, speed) {
        this.dir = dir || 0;
        this.speed = speed || 3;
    };

    window.Components = {
        "Position": Position,
        "Colour": Colour,
        "Velocity": Velocity
    };
    window.CompTypes = {
        "Position": 1,
        "Colour": 2,
        "Velocity": 3
    }

}());

var prefabs = {
    make: function () {
        var ball = world.create();

        ball.add(new Components.Position(
            Math.random() * 130 + 40 | 0,
            Math.random() * 150 + 40 | 0
        ), CompTypes.Position);
        ball.add(new Components.Velocity(Math.random() * (Math.PI * 2), Math.random() * 100 | 0), CompTypes.Velocity);
        ball.add(new Components.Colour("#030"), CompTypes.Colour);

        return ball;
    }
};

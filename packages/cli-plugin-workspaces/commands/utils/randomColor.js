const color = require("color");

let ratio = 0.618033988749895;
let hue = Math.random();
const saturation = 0.5;
const value = 0.95;

function randomColor() {
    hue += ratio;
    hue %= 1;

    return color({
        h: hue * 360,
        s: saturation * 100,
        v: value * 100
    });
}

module.exports = { randomColor };

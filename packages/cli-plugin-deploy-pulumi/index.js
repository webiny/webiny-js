module.exports = options => [
    require("./aws"),
    require("./esServiceRole"),
    require("./deploy")(options),
    require("./destroy")
];

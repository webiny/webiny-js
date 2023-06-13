module.exports = () => [
    require("./deploy")(),
    require("./destroy")(),
    require("./info"),
    require("./aws")
];

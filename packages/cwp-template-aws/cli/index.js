module.exports = () => [
    require("./open"),
    require("./deploy")(),
    require("./destroy")(),
    require("./info"),
    require("./aws")
];

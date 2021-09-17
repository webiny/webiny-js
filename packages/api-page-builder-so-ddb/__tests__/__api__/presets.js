const path = require("path");
const os = require("os");

const presets = [
    {
        testEnvironment: path.resolve(__dirname, "environment.js"),
        setupFilesAfterEnv: [path.resolve(__dirname, "setupAfterEnv.js")]
    }
];

module.exports = presets;

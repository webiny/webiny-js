const path = require("path");

const presets = [
    {
        testEnvironment: path.resolve(__dirname, "environment.js"),
        setupFilesAfterEnv: [path.resolve(__dirname, "setupAfterEnv.js")]
    }
];

module.exports = presets;

const path = require("path");

const presets = [
    {
        setupFiles: [path.resolve(__dirname, "setupFile.js")],
        setupFilesAfterEnv: [path.resolve(__dirname, "setupAfterEnv.js")]
    }
];

module.exports = presets;

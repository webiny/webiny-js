const path = require("path");

module.exports = [
    {
        setupFiles: [path.resolve(__dirname, "setupFile.js")],
        setupFilesAfterEnv: [path.resolve(__dirname, "setupAfterEnv.js")]
    }
];

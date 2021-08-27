const path = require("path");
const os = require("os");
const esPreset = os.platform() === "win32" ? {} : require("@shelf/jest-elasticsearch/jest-preset");

const isLocalElastic = !!process.env.LOCAL_ELASTICSEARCH;

const presets = [
    isLocalElastic ? {} : esPreset,
    {
        testEnvironment: path.resolve(__dirname, "environment.js"),
        setupFilesAfterEnv: [path.resolve(__dirname, "setupAfterEnv.js")]
    }
];

module.exports = presets;

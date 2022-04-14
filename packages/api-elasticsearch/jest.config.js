const base = require("../../jest.config.base");
const os = require("os");
const esPreset = os.platform() === "win32" ? {} : require("@shelf/jest-elasticsearch/jest-preset");

const presets = [];
if (!process.env.LOCAL_ELASTICSEARCH) {
    presets.push(esPreset);
}
module.exports = base(
    {
        path: __dirname
    },
    presets
);

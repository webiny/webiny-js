const os = require("os");
const esPreset = os.platform() === "win32" ? {} : require("@shelf/jest-elasticsearch/jest-preset");
const base = require("RELATIVE_ROOT_PATH/jest.config.base");

module.exports = {
    ...base({ path: __dirname }, esPreset)
};

const os = require("os");
const dynamoDbPreset = require("jest-dynalite/jest-preset");
const base = require("../../jest.config.base");
const esPreset = os.platform() === "win32" ? {} : require("@shelf/jest-elasticsearch/jest-preset");

module.exports = {
    ...base({ path: __dirname }, [dynamoDbPreset, esPreset])
};

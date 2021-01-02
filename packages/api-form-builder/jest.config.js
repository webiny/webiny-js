const os = require("os");
const dynamoDbPreset = require("jest-dynalite/jest-preset");
const esPreset = os.platform() === "win32" ? {} : require("@shelf/jest-elasticsearch/jest-preset");
const base = require("../../jest.config.base");

const localElastic = !!process.env.LOCAL_ELASTICSEARCH;

module.exports = {
    ...base({ path: __dirname }, [dynamoDbPreset, localElastic ? {} : esPreset])
};

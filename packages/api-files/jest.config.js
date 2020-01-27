const mongoDbPreset = require("@shelf/jest-mongodb/jest-preset");
const base = require("../../jest.config.base");

module.exports = {
    ...base({ name: "api-files", path: __dirname }, [mongoDbPreset])
};

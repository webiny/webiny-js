const mongoDbPreset = require("@shelf/jest-mongodb/jest-preset");
const base = require("../../jest.config.base");

module.exports = {
    ...base({ path: __dirname }, [mongoDbPreset])
};

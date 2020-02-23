// We need at least MongoDB@4.0.7
process.env.MONGOMS_VERSION = "4.0.7";

const mongoDbPreset = require("@shelf/jest-mongodb/jest-preset");
const base = require("../../jest.config.base");

module.exports = {
    ...base({ name: "api-headless-cms", path: __dirname }, [mongoDbPreset])
};

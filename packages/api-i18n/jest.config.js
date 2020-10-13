const dynamoDbPreset = require("@shelf/jest-dynamodb/jest-preset");
const base = require("../../jest.config.base");

module.exports = {
    ...base({ path: __dirname }, [dynamoDbPreset])
};

const dynamoDbPreset = require("jest-dynalite/jest-preset");
const base = require("RELATIVE_ROOT_PATH/jest.config.base");

module.exports = {
    ...base({ path: __dirname }, [dynamoDbPreset])
};

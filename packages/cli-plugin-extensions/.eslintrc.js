const defaultConfig = require("../../.eslintrc");

module.exports = {
    ...defaultConfig,
    rules: {
        ...defaultConfig.rules,
        "import/dynamic-import-chunkname": 0
    }
};

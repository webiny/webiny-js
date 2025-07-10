const base = require("../../jest.config.base");
const presets = require("@webiny/project-utils/testing/presets")(["storage-operations"]);

module.exports = {
    ...base({ path: __dirname }, presets)
};

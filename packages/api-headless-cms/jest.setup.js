const base = require("../../jest.config.base");
const packagesPresets = require("@webiny/project-utils/testing/presets")([
    "@webiny/api-headless-cms",
    "storage-operations"
]);

module.exports = packagesPresets.map(presets => base({ path: __dirname }, presets));

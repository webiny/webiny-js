const base = require("../../jest.config.base");
const presets = require("@webiny/project-utils/testing/presets")([
    "@webiny/api-prerendering-service",
    "storage-operations"
]);

module.exports = {
    ...base({ path: __dirname }, presets)
};

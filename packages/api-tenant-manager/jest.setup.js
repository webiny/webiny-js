const base = require("../../jest.config.base");
const presets = require("@webiny/project-utils/testing/presets")(
    ["@webiny/api-security", "storage-operations"],
    ["@webiny/api-tenancy", "storage-operations"]
);

module.exports = {
    ...base({ path: __dirname }, presets)
};

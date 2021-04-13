const base = require("../../jest.config.base");
const items = require("@webiny/project-utils/testing/presets")(
    ["@webiny/api-headless-cms", "storage-operations"],
    "storage-operations"
);

process.env.AWS_SDK_LOAD_CONFIG = 1;

module.exports = items.map(item => {
    return {
        ...base({ path: __dirname }, item.presets),
        name: item.name,
        displayName: item.name
    };
});

const base = require("../../jest.config.base");
const items = require("@webiny/project-utils/testing/presets")(
    ["@webiny/api-headless-cms", "storage-operations"],
    "aco-storage-operations"
);

module.exports = items.map(item => {
    return {
        ...base({ path: __dirname }, item.presets),
        name: item.name,
        displayName: item.name,
        keywords: item.package.keywords
    };
});

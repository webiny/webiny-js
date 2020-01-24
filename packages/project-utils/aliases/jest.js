const path = require("path");
const fs = require("fs");
const readJson = require("read-json-sync");
const packages = require("../packages");

module.exports = packages.reduce((aliases, dir) => {
    try {
        const json = readJson(path.join(dir, "package.json"));
        if (fs.existsSync(path.join(dir, "dist"))) {
            aliases[`^${json.name}$`] = `${json.name}/dist`;
            aliases[`^${json.name}/(.*)$`] = `${json.name}/dist/\\1`;
        }
    } catch (err) {
        // No package.json, continue.
    }
    return aliases;
}, {});

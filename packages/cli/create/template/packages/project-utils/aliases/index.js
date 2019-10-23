const path = require("path");
const loadJson = require("load-json-file");
const packages = require("../packages");

module.exports = packages.reduce((aliases, dir) => {
    try {
        const json = loadJson.sync(path.join(dir, "package.json"));
        aliases[`^${json.name}/(?!src)(.+)$`] = `${json.name}/src/\\1`;
    } catch (err) {
        // No package.json, continue.
    }
    return aliases;
}, {});

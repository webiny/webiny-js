const path = require("path");
const readJson = require("read-json-sync");
const packages = require("../packages");

module.exports = packages.reduce((aliases, dir) => {
    try {
        const json = readJson(path.join(dir, "package.json"));
        aliases[`^${json.name}/(?!src)(.+)$`] = `${json.name}/src/\\1`;
    } catch (err) {
        console.log(err.message);
    }
    return aliases;
}, {});

const path = require("path");
const packages = require("./packages");

module.exports = packages.reduce((aliases, dir) => {
    const name = path.basename(dir);
    aliases[`^${name}/(?!src)(.+)$`] = path.join(name, "src", "\\1");
    return aliases;
}, {});
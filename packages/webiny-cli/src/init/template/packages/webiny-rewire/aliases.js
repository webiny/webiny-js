const path = require("path");
const packages = require("./packages");

// Create aliases to allow importing from "src" folder of each monorepo package.
module.exports = packages.reduce((aliases, dir) => {
    const name = path.basename(dir);
    aliases[`^${name}/(?!src)(.+)$`] = path.join(name, "src", "\\1");
    return aliases;
}, {});

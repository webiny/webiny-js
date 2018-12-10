// @flowIgnore
const path = require("path");

module.exports = (packages = []) => {
    return packages.reduce((aliases, dir) => {
        const name = path.basename(dir);
        aliases[`^${name}/(?!src)(.+)$`] = `${name}/src/\\1`;
        return aliases;
    }, {});
};

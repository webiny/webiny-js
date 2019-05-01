const path = require("path");
const getPackages = require("get-yarn-workspaces");

const packages = getPackages(path.resolve("packages")).map(pkg => pkg.replace(/\//g, path.sep));

const aliases = packages.reduce((aliases, dir) => {
    const name = path.basename(dir);
    aliases[`^${name}/(?!src)(.+)$`] = `${name}/src/\\1`;
    return aliases;
}, {});

module.exports = {
    babelrc: true,
    babelrcRoots: packages,
    plugins: [["babel-plugin-module-resolver", { alias: aliases }]]
};

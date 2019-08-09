const aliases = require("@webiny/project-utils/aliases");
const packages = require("@webiny/project-utils/packages");

module.exports = {
    babelrc: true,
    babelrcRoots: packages,
    plugins: [["babel-plugin-module-resolver", { alias: aliases }]]
};

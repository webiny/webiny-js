// This file is require for running tests only!!
const aliases = require("@webiny/project-utils/aliases/jest");
const packages = require("@webiny/project-utils/packages");

module.exports = {
    babelrc: true,
    babelrcRoots: packages,
    plugins: [["babel-plugin-module-resolver", { alias: aliases }]]
};

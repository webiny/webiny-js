// @flowIgnore
const get = require("lodash.get");
const paths = require("react-scripts/config/paths");
const { getPaths } = require("@rescripts/utilities");

const isBabelLoader = x => x && x.loader && x.loader.includes("babel-loader");

module.exports = (rules, packages, aliases) => {
    const babelLoaderPaths = getPaths(isBabelLoader, rules);
    const babelLoader = get(rules, babelLoaderPaths[0].join("."));
    babelLoader.include = [paths.appSrc, ...packages];
    babelLoader.options = {
        ...babelLoader.options,
        babelrc: true,
        babelrcRoots: packages,
        plugins: [["babel-plugin-module-resolver", { alias: aliases }]]
    };
};

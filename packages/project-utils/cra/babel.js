const get = require("lodash.get");
const { getPaths } = require("@rescripts/utilities");

const isBabelLoader = x => x && x.loader && x.loader.includes("babel-loader");

module.exports = rules => {
    const babelLoaderPaths = getPaths(isBabelLoader, rules);
    const babelLoader = get(rules, babelLoaderPaths[0].join("."));
    babelLoader.options = {
        ...babelLoader.options,
        babelrc: true
    };
};

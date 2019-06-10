const path = require("path");
const get = require("lodash.get");
const paths = require("react-scripts/config/paths");
const { getPaths } = require("@rescripts/utilities");

const isBabelLoader = x => x && x.loader && x.loader.includes("babel-loader");

module.exports = (rules, packages) => {
    const babelLoaderPaths = getPaths(isBabelLoader, rules);
    const babelLoader = get(rules, babelLoaderPaths[0].join("."));
    // Include the main app package + all other monorepo packages (this allows us to use monorepo).
    babelLoader.include = [paths.appSrc, ...packages];
    babelLoader.options = {
        // Use original react-scripts babel-loader options.
        ...babelLoader.options,
        // Set path to `babel.config.js` explicitly, as `react-scripts` disable configFile by default.
        // (https://babeljs.io/docs/en/options#configfile)
        configFile: path.join(paths.appSrc, "..", "babel.config.js"),
        // Enable `babelrc` searching (https://babeljs.io/docs/en/options#babelrc)
        babelrc: true,
        // We must explicitly set paths to all babel roots to transpile them accordingly when importing from the main app.
        // (https://babeljs.io/docs/en/options#babelrcroots)
        babelrcRoots: packages
    };
};

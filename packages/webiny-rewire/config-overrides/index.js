// @flowIgnore
const cloneDeep = require("lodash.clonedeep");
const packages = require("./../packages");
const aliases = require("./../aliases");

module.exports = {
    webpack(config) {
        const newConfig = {
            ...config,
            module: { ...config.module, rules: cloneDeep(config.module.rules) }
        };
        // Enable .babelrc in each monorepo package
        require("./overrides/babel")(newConfig.module.rules, packages, aliases);

        // Add proper includePaths
        require("./overrides/sass")(newConfig);

        return newConfig;
    },
    jest: config => {
        config["moduleNameMapper"] = config["moduleNameMapper"] || {};
        config["moduleNameMapper"]["^@svgr/webpack!.*$"] = __dirname + "/svgImportMock";

        return config;
    }
};

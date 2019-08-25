const cloneDeep = require("lodash.clonedeep");
const set = require("lodash.set");
const packages = require("../packages");
const aliases = require("../aliases");

const webinyConfig = {
    webpack(config) {
        const newConfig = {
            ...config,
            module: { ...config.module, rules: cloneDeep(config.module.rules) }
        };
        // Enable .babelrc in each monorepo package
        require("./babel")(newConfig.module.rules, packages, aliases);

        // Add proper includePaths
        require("./sass")(newConfig);

        return newConfig;
    },
    jest: config => {
        config["moduleNameMapper"] = config["moduleNameMapper"] || {};
        config["moduleNameMapper"]["^@svgr/webpack!.*$"] = __dirname + "/svgImportMock";

        return config;
    },
    devServer: config => {
        set(config, "proxy./files", process.env.REACT_APP_FUNCTIONS_HOST);
        return config;
    }
};

module.exports = (customizer = null) => {
    if (typeof customizer === "function") {
        return customizer(webinyConfig);
    }

    return webinyConfig;
};

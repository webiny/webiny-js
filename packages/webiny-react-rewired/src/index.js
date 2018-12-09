// @flowIgnore
const _ = require("lodash");

module.exports = (rewired = {}) => {
    const packages = rewired.packages || require("./packages")();
    const aliases = rewired.aliases || require("./aliases")(packages);

    return {
        webpack(config) {
            const newConfig = { ...config, module: { ...config.module, rules: _.cloneDeep(config.module.rules) } };
            // Enable .babelrc in each monorepo package
            const overrideBabel = rewired.overrideBabel || require("./overrides/babel");
            overrideBabel({ packages, aliases })(newConfig.module.rules);

            // Add proper includePaths
            const overrideSass = rewired.overrideSass || require("./overrides/sass");
            overrideSass(newConfig);

            return newConfig;
        }
    };
};
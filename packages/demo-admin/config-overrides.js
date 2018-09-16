const overrideBabel = require("./overrides/babel");
const overrideSass = require("./overrides/sass");

module.exports = {
    webpack(config) {
        // Enable .babelrc in each monorepo package
        overrideBabel(config.module.rules);

        // Add proper includePaths
        overrideSass(config);

        return config;
    }
};

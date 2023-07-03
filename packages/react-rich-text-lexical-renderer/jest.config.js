const base = require("../../jest.config.base");

module.exports = {
    ...base({ path: __dirname }),
    // allow css imports in the components
    moduleNameMapper: {
        "\\.(css|sass)$": "identity-obj-proxy"
    }
};

const base = require("../../jest.config.base");

process.env.NODE_ENV = "development";

module.exports = {
    ...base({ path: __dirname }),
    moduleNameMapper: {
        "\\.(css|sass)$": "identity-obj-proxy"
    },
    setupFilesAfterEnv: [require.resolve("./__tests__/setup/setupEnv.ts")]
};

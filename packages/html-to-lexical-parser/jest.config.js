const base = require("../../jest.config.base");

module.exports = {
    ...base({ path: __dirname }),
    moduleNameMapper: {
        "\\.(css|sass)$": "identity-obj-proxy"
    },
    setupFilesAfterEnv: [require.resolve("./__tests__/setupEnv.ts")]
};

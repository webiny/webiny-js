const base = require("../../jest.config.base");

module.exports = {
    ...base({ path: __dirname }),
    setupFilesAfterEnv: [require.resolve("./__tests__/setupEnv.ts")]
};

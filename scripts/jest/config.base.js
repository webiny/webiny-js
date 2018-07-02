// @flow
// Append untested libraries to the blacklist - they are all work in progress.
const packages = require("./../utils/listPackages")([
    "webiny-api-cms",
    "webiny-client",
    "webiny-client-admin",
    "webiny-client-cms",
    "webiny-client-ui",
    "webiny-form",
    "webiny-i18n-react",
    "webiny-react-router"
]);

module.exports = {
    setupTestFrameworkScriptFile: "jest-extended",
    transformIgnorePatterns: ["<rootDir>/build/", "node_modules"],
    rootDir: process.cwd(),
    testRegex: `packages/(${packages.join("|")})/.*test.js$`,

    // "collectCoverageFrom" - transform "*.js" to "*.{js,jsx}" when ready.
    collectCoverageFrom: [`packages/{${packages.join(",")}}/src/**/*.js`],

    coverageReporters: ["lcov", "html"]
};

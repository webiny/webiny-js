// @flow
const packages = require("./../utils/listPackages")([
    // Append untested libraries to the blacklist - they are all work in progress.
    "ui",
    "form",
    "i18n-react",
    "storybook-utils"
]);

module.exports = {
    setupTestFrameworkScriptFile: "jest-extended",
    rootDir: process.cwd(),
    testRegex: `packages/(${packages.join("|")})/.*test.js$`,
    // testEnvironment: "node",
    modulePathIgnorePatterns: ["dist"],
    preset: "@shelf/jest-mongodb"
};

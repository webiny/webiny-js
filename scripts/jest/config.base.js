// @flow
const listPackages = require("./../utils/listPackages");

module.exports = {
    setupTestFrameworkScriptFile: "jest-extended",
    transformIgnorePatterns: ["<rootDir>/build/", "node_modules"],
    rootDir: process.cwd(),
    testRegex: `packages/(${listPackages().join("|")})/.*test.js$` // TODO: remove this
};

// TODO: remove this
// @flow
const listPackages = require("./../utils/listPackages");

module.exports = {
    transformIgnorePatterns: ["<rootDir>/build/"],
    rootDir: process.cwd(),
    testRegex: `packages/(${listPackages().join("|")})/.*test.js$` // TODO: remove this
};

const merge = require("merge");
const tsPreset = require("ts-jest/presets/js-with-babel/jest-preset");
const mongoDbPreset = require("@shelf/jest-mongodb/jest-preset");

const packages = require("./scripts/utils/listPackages")([
    // Append untested libraries to the blacklist - they are all work in progress.
    "ui",
    "form",
    "i18n-react",
    "storybook-utils"
]);

module.exports = merge.recursive(tsPreset, mongoDbPreset, {
    rootDir: process.cwd(),
    testRegex: `packages/(${packages.join("|")})/.*test.(ts|js)$`,
    transform: {
        "^.+\\.(ts|tsx)$": "ts-jest"
    },
    moduleDirectories: ["node_modules", "src"],
    moduleFileExtensions: ["ts", "js"],
    modulePathIgnorePatterns: ["dist", ".verdaccio", "build", "packages/cli/create", "examples"],
    globals: {
        "ts-jest": {
            babelConfig: true,
            diagnostics: false
        }
    }
});

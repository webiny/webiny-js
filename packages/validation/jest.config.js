const merge = require("merge");
const tsPreset = require("ts-jest/presets/js-with-babel/jest-preset");
const mongoDbPreset = require("@shelf/jest-mongodb/jest-preset");

module.exports = merge.recursive(tsPreset, mongoDbPreset, {
    rootDir: process.cwd(),
    testRegex: `.*test.(ts|js)$`,
    transform: {
        "^.+\\.(ts|tsx)$": "ts-jest"
    },
    moduleDirectories: ["node_modules", "src"],
    moduleFileExtensions: ["ts", "js", "tsx"],
    modulePathIgnorePatterns: ["dist", ".verdaccio", "build", "packages/cli/create", "examples"],
    globals: {
        "ts-jest": {
            babelConfig: "./.babelrc.js",
            diagnostics: false
        }
    }
});

const { basename } = require("path");
const merge = require("merge");
const tsPreset = require("ts-jest/presets/js-with-babel/jest-preset");

module.exports = ({ path }, presets = []) => {
    const name = basename(path);
    return merge.recursive({}, tsPreset, ...presets, {
        name: name,
        displayName: name,
        modulePaths: [`${path}/src`],
        testMatch: [`${path}/__tests__/**/*.test.[jt]s?(x)`],
        transform: {
            "^.+\\.(ts|tsx)$": "ts-jest"
        },
        moduleDirectories: ["node_modules"],
        moduleFileExtensions: ["ts", "js", "tsx"],
        modulePathIgnorePatterns: [],
        globals: {
            "ts-jest": {
                babelConfig: `${path}/.babelrc.js`,
                diagnostics: false
            }
        }
    });
};

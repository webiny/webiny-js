const merge = require("merge");
const tsPreset = require("ts-jest/presets/js-with-babel/jest-preset");

module.exports = ({ name, path }) =>
    merge.recursive(tsPreset, {
        name: name,
        displayName: name,
        modulePaths: [`${path}/src`],
        testMatch: [`${path}/__tests__/*.test.[jt]s?(x)`],
        transform: {
            "^.+\\.(ts|tsx)$": "ts-jest"
        },
        moduleDirectories: ["node_modules", "src"],
        moduleFileExtensions: ["ts", "js", "tsx"],
        modulePathIgnorePatterns: [],
        globals: {
            "ts-jest": {
                babelConfig: `${path}/.babelrc.js`,
                diagnostics: false
            }
        }
    });

const { basename } = require("path");
const merge = require("merge");
const tsPreset = require("ts-jest/presets/js-with-babel/jest-preset");

module.exports = ({ path }, presets = []) => {
    const name = basename(path);

    // Enables us to run tests of only a specific type (for example "integration" or "e2e").
    let type = "";
    if (process.env.TEST_TYPE) {
        type = `.${process.env.TEST_TYPE}`;
    }

    return merge.recursive({}, tsPreset, ...presets, {
        name: name,
        displayName: name,
        modulePaths: [`${path}/src`],
        testMatch: [`${path}/**/__tests__/**/*${type}.test.[jt]s?(x)`],
        transform: {
            "^.+\\.(ts|tsx)$": "ts-jest"
        },
        moduleNameMapper: {
            "~/(.*)": `${path}/src/$1`
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

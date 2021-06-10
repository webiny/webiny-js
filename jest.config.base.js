const { basename } = require("path");
const merge = require("merge");
const tsPreset = require("ts-jest/presets/js-with-babel/jest-preset");
const { version } = require("@webiny/cli/package.json");

process.env.DB_TABLE_ELASTICSEARCH = "ElasticSearchStream";
process.env.WEBINY_VERSION = version;

module.exports = ({ path }, presets = []) => {
    const name = basename(path);
    return merge.recursive({}, tsPreset, ...presets, {
        name: name,
        displayName: name,
        modulePaths: [`${path}/src`],
        testMatch: [`${path}/**/__tests__/**/*.test.[jt]s?(x)`],
        transform: {
            "^.+\\.(ts|tsx)$": "ts-jest"
        },
        moduleDirectories: ["node_modules"],
        moduleFileExtensions: ["ts", "js", "tsx"],
        moduleNameMapper: {
            "~/(.*)": `${path}/src/$1`
        },
        modulePathIgnorePatterns: [],
        globals: {
            WEBINY_VERSION: version,
            "ts-jest": {
                isolatedModules: true,
                babelConfig: `${path}/.babelrc.js`,
                diagnostics: false
            }
        },
        collectCoverage: false,
        collectCoverageFrom: ["packages/**/*.{ts,tsx,js,jsx}"],
        coverageReporters: ["html"]
    });
};

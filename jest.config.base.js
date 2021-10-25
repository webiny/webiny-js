const { basename } = require("path");
const merge = require("merge");
const tsPreset = require("ts-jest/presets/js-with-babel/jest-preset");
const { version } = require("@webiny/cli/package.json");

process.env.DB_TABLE = "DynamoDB";
process.env.DB_TABLE_ELASTICSEARCH = "ElasticSearchStream";
process.env.WEBINY_VERSION = version;

Object.defineProperty(process.env, "DB_TABLE", {
    get: function () {
        console.log(`DB table: ${this.DB_TABLE}`);
        throw new Error("Getting DB_TABLE");
    },
    set: function (value) {
        console.log(`DB table: ${this.DB_TABLE} -> ${value}`);
        throw new Error("TRYING TO SET DB_TABLE");
    }
});
Object.defineProperty(process.env, "DB_TABLE_ELASTICSEARCH", {
    get: function () {
        console.log(`ES table: ${this.DB_TABLE_ELASTICSEARCH}`);
        throw new Error("Getting DB_TABLE_ELASTICSEARCH");
    },
    set: function (value) {
        console.log(`ES table: ${this.DB_TABLE_ELASTICSEARCH} -> ${value}`);
        throw new Error("TRYING TO SET DB_TABLE_ELASTICSEARCH");
    }
});

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

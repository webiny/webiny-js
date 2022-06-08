const { basename } = require("path");
const merge = require("merge");
const tsPreset = require("ts-jest/presets/js-with-babel/jest-preset");
const { version } = require("@webiny/cli/package.json");

module.exports = function ({ path }, presets = []) {
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

process.env.DB_TABLE = "DynamoDB";
process.env.DB_TABLE_ELASTICSEARCH = "ElasticsearchStream";
process.env.WEBINY_VERSION = version;
process.env.WEBINY_ELASTICSEARCH_INDEX_LOCALE = "true";

const createDynaliteTables = () => {
    return {
        tables: [
            {
                TableName: process.env.DB_TABLE,
                KeySchema: [
                    { AttributeName: "PK", KeyType: "HASH" },
                    { AttributeName: "SK", KeyType: "RANGE" }
                ],
                AttributeDefinitions: [
                    { AttributeName: "PK", AttributeType: "S" },
                    { AttributeName: "SK", AttributeType: "S" },
                    { AttributeName: "GSI1_PK", AttributeType: "S" },
                    { AttributeName: "GSI1_SK", AttributeType: "S" }
                ],
                ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 },
                GlobalSecondaryIndexes: [
                    {
                        IndexName: "GSI1",
                        KeySchema: [
                            { AttributeName: "GSI1_PK", KeyType: "HASH" },
                            { AttributeName: "GSI1_SK", KeyType: "RANGE" }
                        ],
                        Projection: {
                            ProjectionType: "ALL"
                        },
                        ProvisionedThroughput: {
                            ReadCapacityUnits: 1,
                            WriteCapacityUnits: 1
                        }
                    }
                ]
            },
            {
                TableName: process.env.DB_TABLE_ELASTICSEARCH,
                KeySchema: [
                    { AttributeName: "PK", KeyType: "HASH" },
                    { AttributeName: "SK", KeyType: "RANGE" }
                ],
                AttributeDefinitions: [
                    { AttributeName: "PK", AttributeType: "S" },
                    { AttributeName: "SK", AttributeType: "S" }
                ],
                ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 }
            }
        ],
        basePort: 8000
    };
};

module.exports.createDynaliteTables = createDynaliteTables;

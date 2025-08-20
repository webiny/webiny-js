const { basename, join, dirname } = require("path");
const fs = require("fs");
const merge = require("deepmerge");
const findUp = require("find-up");
const tsPreset = require("ts-jest/presets/js-with-babel/jest-preset");
const { version } = require("@webiny/cli/package.json");

module.exports = function ({ path }, presets = []) {
    const name = basename(path);

    // Enables us to run tests of only a specific type (for example "integration" or "e2e").
    let type = "";
    if (process.env.TEST_TYPE) {
        type = `.${process.env.TEST_TYPE}`;
    }

    process.env.JEST_DYNALITE_CONFIG_DIRECTORY = path;

    const merged = merge.all([
        { setupFilesAfterEnv: [] },
        tsPreset,
        {
            resolver: "ts-jest-resolver",
            displayName: name,
            modulePaths: [`${path}/src`],
            testMatch: [`${path}/**/*${type}.test.[jt]s?(x)`],
            transform: {
                "^.+\\.[jt]sx?$": [
                    "ts-jest",
                    {
                        isolatedModules: true,
                        babelConfig: `${path}/.babelrc.js`,
                        diagnostics: false
                    }
                ]
            },
            transformIgnorePatterns: ["/node_modules/(?!(nanoid|cheerio)/)"],
            moduleDirectories: ["node_modules"],
            moduleNameMapper: {
                "~tests/(.*)": `${path}/__tests__/$1`,
                "~/(.*)": `${path}/src/$1`
            },
            modulePathIgnorePatterns: [
                "<rootDir>/.verdaccio",
                "<rootDir>/.webiny",
                "<rootDir>/apps",
                "<rootDir>/packages/.*/dist"
            ],
            globals: {
                WEBINY_VERSION: version
            },
            watchman: false
        }
    ]);

    merged.setupFiles = [
        ...(merged.setupFiles || []),
        ...presets
            .map(preset => preset.setupFiles)
            .flat()
            .filter(Boolean)
    ];

    const setupAfterEnv = join(path, "__tests__", "setup", "setupAfterEnv.js");
    const setupAfterEnvExists = fs.existsSync(setupAfterEnv);

    merged.setupFilesAfterEnv = [
        "jest-extended/all",
        join(__dirname, "jest.config.base.setup.js"),
        setupAfterEnvExists ? setupAfterEnv : null,
        ...merged.setupFilesAfterEnv,
        ...presets.map(preset => preset.setupFilesAfterEnv || []).flat()
    ].filter(Boolean);

    // IMPORTANT!
    // We need to delete the following keys to let our rules be the only ones applied.
    delete merged.transform["^.+\\.jsx?$"];
    delete merged.transform["^.+\\.tsx?$"];

    process.stdout.write(`Loading test setup files from the following packages:\n`);
    merged.setupFilesAfterEnv.forEach(setupFile => {
        const filePkg = findUp.sync("package.json", { cwd: dirname(setupFile) });
        const pkg = require(filePkg);
        if (pkg.name) {
            process.stdout.write(`- ${pkg.name}\n`);
        }
    });

    process.stdout.write(`\n---------------------------\n`);

    return merged;
};

process.env.DB_TABLE = "DynamoDB";
process.env.DB_TABLE_ELASTICSEARCH = "ElasticsearchStream";
process.env.DB_TABLE_LOG = "DynamoDBLog";
process.env.DB_TABLE_AUDIT_LOGS = "DynamoDBAuditLogs";
process.env.WEBINY_VERSION = version;
process.env.WEBINY_ELASTICSEARCH_INDEX_LOCALE = "true";

const createGlobalSecondaryIndexesAttributeDefinitions = amount => {
    const attributes = [];

    for (let current = 1; current <= amount; current++) {
        attributes.push({ AttributeName: `GSI${current}_PK`, AttributeType: "S" });
        attributes.push({ AttributeName: `GSI${current}_SK`, AttributeType: "S" });
    }
    return attributes;
};

const createGlobalSecondaryIndexes = options => {
    if (!options.amount) {
        return [];
    }
    const indexes = [];
    for (let current = 1; current <= options.amount; current++) {
        indexes.push({
            IndexName: `GSI${current}`,
            KeySchema: [
                { AttributeName: `GSI${current}_PK`, KeyType: "HASH" },
                { AttributeName: `GSI${current}_SK`, KeyType: "RANGE" }
            ],
            Projection: {
                ProjectionType: "ALL"
            },
            ProvisionedThroughput: {
                ReadCapacityUnits: 1,
                WriteCapacityUnits: 1
            }
        });
    }

    return indexes;
};

const createDynaliteTables = (options = {}) => {
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
                    ...createGlobalSecondaryIndexesAttributeDefinitions(2)
                ],
                ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 },
                GlobalSecondaryIndexes: createGlobalSecondaryIndexes({
                    amount: 2
                }),
                data: options.data || []
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
            },
            {
                TableName: process.env.DB_TABLE_LOG,
                KeySchema: [
                    { AttributeName: "PK", KeyType: "HASH" },
                    { AttributeName: "SK", KeyType: "RANGE" }
                ],
                AttributeDefinitions: [
                    { AttributeName: "PK", AttributeType: "S" },
                    { AttributeName: "SK", AttributeType: "S" },
                    ...createGlobalSecondaryIndexesAttributeDefinitions(5)
                ],
                ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 },
                GlobalSecondaryIndexes: createGlobalSecondaryIndexes({
                    amount: 5
                }),
                data: options.data || []
            },
            {
                TableName: process.env.DB_TABLE_AUDIT_LOGS,
                KeySchema: [
                    { AttributeName: "PK", KeyType: "HASH" },
                    { AttributeName: "SK", KeyType: "RANGE" }
                ],
                AttributeDefinitions: [
                    { AttributeName: "PK", AttributeType: "S" },
                    { AttributeName: "SK", AttributeType: "S" },
                    ...createGlobalSecondaryIndexesAttributeDefinitions(2)
                ],
                ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 },
                GlobalSecondaryIndexes: createGlobalSecondaryIndexes({
                    amount: 2
                }),
                data: options.data || [],
                ttl: {
                    attributeName: "expiresAt",
                    enabled: true
                }
            }
        ],
        basePort: 8000
    };
};

module.exports.createDynaliteTables = createDynaliteTables;

const base = require("../../../jest.config.base");
const { getStackOutput } = require("@webiny/cli-plugin-deploy-pulumi/utils");

/**
 * `getStackOutput` retrieves all values that were exported from `api/pulumi/dev/index.ts`.
 * Note that this means the project needs to be already deployed into the "dev" environment.
 * If you want to use a different environment for testing purposes, change the `env` argument.
 */
const stackOutput = getStackOutput({ folder: "api", env: "dev" });

Object.assign(process.env, {
    // We assign `region`, `dynamoDbTable`, and `apiUrl` as AWS_REGION, DB_TABLE, and API_URL
    // environment variables. If needed, you can export additional values from the mentioned
    // `api/pulumi/dev/index.ts` file and assign them here.
    AWS_REGION: stackOutput.region,
    DB_TABLE: stackOutput.dynamoDbTable,
    API_URL: stackOutput.apiUrl,

    // Can be of use while writing tests, for example to distinguish test data from non-test data.
    TEST_RUN_ID: new Date().getTime()
});

module.exports = { ...base({ path: __dirname }) };

const base = require("PATH/jest.config.base");
const { log } = require("@webiny/cli/utils");
const { getStackOutput } = require("@webiny/cli-plugin-deploy-pulumi/utils");

/**
 * `getStackOutput` retrieves all values that were exported from `project/application/path/pulumi/dev/index.ts`.
 * Note that this means the project needs to be already deployed into the "dev" environment. If you want to use
 * a different environment for testing purposes, set it via the DEPLOY_ENVIRONMENT constant.
 * Finally, note that unit tests do not rely on any cloud infrastructure, hence the if statement in line 15.
 */

const TEST_TYPE = process.env.TEST_TYPE;
const DEPLOY_ENVIRONMENT = "dev";

if (TEST_TYPE !== "unit") {
    log.info(
        `${log.info.hl(
            "project/application/path/code/graphql"
        )}: Assigning environment variables...`
    );
    const stackOutput = getStackOutput({
        folder: "project/application/path",
        env: DEPLOY_ENVIRONMENT
    });

    if (stackOutput) {
        // Assign received values as environment variables.
        Object.assign(process.env, {
            // We assign `region`, `dynamoDbTable`, and `apiUrl` as AWS_REGION, DB_TABLE, and API_URL
            // environment variables. If needed, you can export additional values from the mentioned
            // `api/pulumi/dev/index.ts` file and assign them here.
            AWS_REGION: stackOutput.region,
            DB_TABLE: stackOutput.dynamoDbTable,
            API_URL: stackOutput.graphqlApiUrl,

            // Can be of use while writing tests, for example to distinguish test data from non-test data.
            TEST_RUN_ID: new Date().getTime()
        });
        log.success("Environment variables successfully assigned.");
    } else {
        log.warning(`Could not assign environment variables.`);
    }
    console.log();
}

// Finally, export Jest config to be used while tests are being run.
module.exports = { ...base({ path: __dirname }) };

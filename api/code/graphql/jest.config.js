const base = require("../../../jest.config.base");
const { log } = require("@webiny/cli/utils");
const { getStackOutput } = require("@webiny/cli-plugin-deploy-pulumi/utils");

/**
 * `getStackOutput` retrieves all values that were exported from `api/pulumi/dev/index.ts`.
 * Note that this means the project needs to be already deployed into the "dev" environment.
 * If you want to use a different environment for testing purposes, change the `env` argument.
 * Finally, note that usually we don't need to perform this step if we're running unit tests.
 */

const TEST_TYPE = process.env.TEST_TYPE;
const DEPLOY_ENVIRONMENT = "dev";

if (TEST_TYPE !== "unit") {
    log.info(`Retrieving ${log.info.hl("API")} project application\'s stack output...`);
    const stackOutput = getStackOutput({ folder: "api", env: DEPLOY_ENVIRONMENT });

    if (stackOutput) {
        const assign = {
            // We assign `region`, `dynamoDbTable`, and `apiUrl` as AWS_REGION, DB_TABLE, and API_URL
            // environment variables. If needed, you can export additional values from the mentioned
            // `api/pulumi/dev/index.ts` file and assign them here.
            AWS_REGION: stackOutput.region,
            DB_TABLE: stackOutput.dynamoDbTable,
            API_URL: stackOutput.apiUrl,

            // Can be of use while writing tests, for example to distinguish test data from non-test data.
            TEST_RUN_ID: new Date().getTime()
        };

        // Assign received values as environment variables.
        Object.assign(process.env, assign);
        log.success("The following environments variables were assigned:");
        console.log(log.success.hl(JSON.stringify(assign, null, 2)));
    } else {
        log.warning(
            `Could not read ${log.warning.hl(
                "API"
            )} project application's stack output (${log.warning.hl(
                DEPLOY_ENVIRONMENT
            )} environment). Maybe you didn't deploy it?`
        );
    }
}

// Finally, export Jest config to be used while tests are being run.
module.exports = { ...base({ path: __dirname }) };

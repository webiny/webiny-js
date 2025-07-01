const base = require("../../../jest.config.base");
const { log } = require("@webiny/cli/utils");
const { getStackOutput } = require("@webiny/cli-plugin-deploy-pulumi/utils");

const TEST_TYPE = process.env.TEST_TYPE;
const DEPLOY_ENVIRONMENT = "dev";

if (TEST_TYPE !== "unit") {
    log.info(`${log.info.hl("apps/sync/input")}: Assigning environment variables...`);
    const stackOutput = getStackOutput({ folder: "apps/sync", env: DEPLOY_ENVIRONMENT });

    if (stackOutput) {
        Object.assign(process.env, {
            AWS_REGION: stackOutput.region,
            DB_TABLE: stackOutput.dynamoDbTable,
            API_URL: stackOutput.apiUrl,
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

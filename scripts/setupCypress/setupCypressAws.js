import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { assertProjectFolder, readWebinyOutput, writeCypressConfig } from "./shared.js";

/**
 * Prepares cypress.config.ts for an AWS-deployed project, reading the values back from the
 * deployed stacks' output.
 *
 * Pass "--env" to specify from which environment in the ".webiny" folder you want to read.
 * Pass "--force" if you want to allow overwriting an existing cypress.config.ts.
 * Pass "--project-folder" to specify which project to set up configuration against.
 * Pass "--localhost" when the Admin app is served locally rather than from its deployed URL.
 */
const argv = yargs(hideBin(process.argv)).argv;

const args = {
    env: argv.env || "dev",
    force: argv.force || false,
    localhost: argv.localhost || false,
    projectFolder: argv.projectFolder || null
};

assertProjectFolder(args.projectFolder);

const api = readWebinyOutput("api", args);

// With a "local" stack the Admin app is served from localhost rather than from a bucket.
const adminUrl = args.localhost ? "http://localhost:3001" : readWebinyOutput("admin", args).appUrl;

writeCypressConfig({
    force: args.force,
    values: {
        API_URL: api.apiUrl,
        ADMIN_URL: adminUrl,
        AWS_COGNITO_USER_POOL_ID: api.cognitoUserPoolId,
        AWS_COGNITO_CLIENT_ID: api.cognitoAppClientId
    }
});

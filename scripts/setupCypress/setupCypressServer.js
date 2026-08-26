import chalk from "chalk";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { writeCypressConfig } from "./shared.js";

const { green, red } = chalk;

/**
 * Prepares cypress.config.ts for a self-hosted ("server" hosting type) project.
 *
 * Unlike the AWS counterpart there is nothing to read the values back from: a self-hosted project
 * is not deployed, so the URLs are passed in. It also has its own identity provider, so the Cognito
 * values are blank - they are still substituted so the generated config stays valid TypeScript.
 *
 * Pass "--api-url" and "--admin-url" - both required.
 * Pass "--force" if you want to allow overwriting an existing cypress.config.ts.
 */
const argv = yargs(hideBin(process.argv)).argv;

const args = {
    force: argv.force || false,
    apiUrl: argv.apiUrl || null,
    adminUrl: argv.adminUrl || null
};

if (!args.apiUrl || !args.adminUrl) {
    console.log(
        `${red("--api-url")} and ${red("--admin-url")} are both required. Example:\n  ${green("yarn setup-cypress:server --apiUrl http://localhost:3002 --adminUrl http://localhost:3001")}`
    );
    process.exit(1);
}

writeCypressConfig({
    force: args.force,
    values: {
        HOSTING_TYPE: "server",
        API_URL: args.apiUrl,
        ADMIN_URL: args.adminUrl,
        AWS_COGNITO_USER_POOL_ID: "",
        AWS_COGNITO_CLIENT_ID: ""
    }
});

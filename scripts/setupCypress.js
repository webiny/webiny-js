const path = require("path");
const loadJson = require("load-json-file");
const writeJson = require("write-json-file");
const fs = require("fs");
const { green, red } = require("chalk");
const { argv } = require("yargs");
const { getStackOutput } = require("@webiny/cli-plugin-deploy-pulumi/utils");

const args = {
    env: argv.env || "dev",
    force: argv.force || false,
    localhost: argv.localhost || false,
    projectFolder: argv.projectFolder || null
};

/**
 * Prepares cypress.json config by reading values from state files and populating necessary variables.
 * Pass "--env" to specify from which environment in the ".webiny" folder you want to read.
 * Pass "--force" if you want to allow overwriting existing cypress.json config file.
 * Pass "--project-folder" to specify from which project you'd like to set up configuration against
 */
(async () => {
    if (args.projectFolder) {
        if (!fs.existsSync(args.projectFolder)) {
            console.log(`Could not find specified project (received ${red(args.projectFolder)}).`);
            process.exit(0);
        }
    }

    const cypressExampleConfigPath = path.resolve("example.cypress.json");
    const cypressConfigPath = path.resolve("cypress.json");
    if (fs.existsSync(cypressConfigPath)) {
        if (args.force) {
            fs.unlinkSync(cypressConfigPath);
            fs.copyFileSync(cypressExampleConfigPath, cypressConfigPath);
        } else {
            console.log(`⚠️  ${green("cypress.json")} already exists, exiting.`);
            process.exit(0);
        }
    } else {
        fs.copyFileSync(cypressExampleConfigPath, cypressConfigPath);
    }

    const cypressConfig = await loadJson.sync(cypressConfigPath);

    const apiOutput = getStackOutput({
        folder: "api",
        env: args.env,
        cwd: args.projectFolder
    });

    cypressConfig.env.API_URL = apiOutput.apiUrl;
    cypressConfig.env.GRAPHQL_API_URL = apiOutput.apiUrl + "/graphql";
    cypressConfig.env.CMS_MANAGE_GRAPHQL_API_URL = apiOutput.apiUrl + "/cms/manage";

    cypressConfig.env.AWS_COGNITO_USER_POOL_ID = apiOutput.cognitoUserPoolId;
    cypressConfig.env.AWS_COGNITO_CLIENT_ID = apiOutput.cognitoAppClientId;
    // Option for "cypress-image-snapshot" helper
    cypressConfig.env.failOnSnapshotDiff = false;

    // If testing with "local" stack, use "localhost" for the app URLs, otherwise fetch from state files.

    if (args.localhost) {
        const adminUrl = "http://localhost:3001";
        const websiteUrl = "http://localhost:3000";
        cypressConfig.baseUrl = adminUrl;
        cypressConfig.env.ADMIN_URL = adminUrl;
        cypressConfig.env.WEBSITE_URL = websiteUrl;
        cypressConfig.env.WEBSITE_PREVIEW_URL = websiteUrl;
    } else {
        const adminOutput = getStackOutput({
            folder: "apps/admin",
            env: args.env,
            cwd: args.projectFolder
        });
        const websiteOutput = getStackOutput({
            folder: "apps/website",
            env: args.env,
            cwd: args.projectFolder
        });

        cypressConfig.baseUrl = adminOutput.appUrl;
        cypressConfig.env.ADMIN_URL = adminOutput.appUrl;
        cypressConfig.env.WEBSITE_URL = websiteOutput.deliveryUrl;
        cypressConfig.env.WEBSITE_PREVIEW_URL = websiteOutput.appUrl;
    }

    await writeJson(cypressConfigPath, cypressConfig);

    console.log(
        `${green("✔")} Created ${green(
            "cypress.json"
        )} config file! To open Cypress, just run ${green("cypress open")} in your terminal.`
    );

    console.log(`Created config:`);
    console.log(JSON.stringify(cypressConfig, null, 4));
})();

const path = require("path");
const loadJson = require("load-json-file");
const writeJson = require("write-json-file");
const fs = require("fs");
const { green } = require("chalk");
const { argv } = require("yargs");
const { getStackOutput } = require("@webiny/cli-plugin-deploy-pulumi/utils");

const PROJECT_FOLDER = ".";

const params = {
    env: argv.env || "dev",
    force: argv.force || false,
    local: argv.local || false
};

/**
 * Prepares cypress.json config by reading values from state files and populating necessary variables.
 * Pass "--env" to specify from which environment in the ".webiny" folder you want to read.
 * Pass "--force" if you want to allow overwriting existing cypress.json config file.
 */
(async () => {
    const cypressExampleConfigPath = path.resolve(PROJECT_FOLDER, "example.cypress.json");
    const cypressConfigPath = path.resolve(PROJECT_FOLDER, "cypress.json");
    if (fs.existsSync(cypressConfigPath)) {
        if (params.force) {
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

    const apiOutput = await getStackOutput("api", params.env);

    cypressConfig.env.API_URL = apiOutput.apiUrl;
    cypressConfig.env.GRAPHQL_API_URL = apiOutput.apiUrl + "/graphql";

    cypressConfig.env.AWS_COGNITO_USER_POOL_ID = apiOutput.cognitoUserPoolId;
    cypressConfig.env.AWS_COGNITO_CLIENT_ID = apiOutput.cognitoAppClientId;

    // If testing with "local" stack, use "localhost" for the app URLs, otherwise fetch from state files.


    if (params.local) {
        const adminUrl = "http://localhost:3001";
        const siteUrl = "http://localhost:3000";
        cypressConfig.env.SITE_URL = siteUrl;
        cypressConfig.baseUrl = adminUrl;
        cypressConfig.env.ADMIN_URL = adminUrl;
    } else {
        const adminOutput = await getStackOutput("apps/admin", params.env);
        const websiteOutput = await getStackOutput("apps/site", params.env);
        cypressConfig.baseUrl = adminOutput.appUrl;
        cypressConfig.env.ADMIN_URL = adminOutput.appUrl;
        cypressConfig.env.WEBSITE_URL = websiteOutput.deliveryUrl;
        cypressConfig.env.WEBSITE_PREVIEW_URL = websiteOutput.appUrl;
    }

    await writeJson(cypressConfigPath, cypressConfig);

    console.log(
        `${green('✔')} Created ${green('cypress.json')} config file! To open Cypress, just run ${green('cypress open')} in your terminal.`
    );

    console.log(`Created config:`);
    console.log(JSON.stringify(cypressConfig, null, 4));
})();

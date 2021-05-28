const path = require("path");
const loadJson = require("load-json-file");
const writeJson = require("write-json-file");
const fs = require("fs");
const { green } = require("chalk");
const { argv } = require("yargs");
const { getStackOutput } = require("@webiny/cli-plugin-deploy-pulumi/utils");


const params = {
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
    const cypressExampleConfigPath = path.resolve("example.cypress.json");
    const cypressConfigPath = path.resolve("cypress.json");
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

    const apiOutput = await getStackOutput({
        folder: "api",
        env: params.env,
        cwd: params.projectFolder
    });

    cypressConfig.env.API_URL = apiOutput.apiUrl;
    cypressConfig.env.GRAPHQL_API_URL = apiOutput.apiUrl + "/graphql";

    cypressConfig.env.AWS_COGNITO_USER_POOL_ID = apiOutput.cognitoUserPoolId;
    cypressConfig.env.AWS_COGNITO_CLIENT_ID = apiOutput.cognitoAppClientId;

    // If testing with "local" stack, use "localhost" for the app URLs, otherwise fetch from state files.

    if (params.localhost) {
        const adminUrl = "http://localhost:3001";
        const websiteUrl = "http://localhost:3000";
        cypressConfig.baseUrl = adminUrl;
        cypressConfig.env.ADMIN_URL = adminUrl;
        cypressConfig.env.WEBSITE_URL = websiteUrl;
        cypressConfig.env.WEBSITE_PREVIEW_URL = websiteUrl;
    } else {
        const adminOutput = await getStackOutput({
            folder: "apps/admin",
            env: params.env,
            cwd: params.projectFolder
        });
        const websiteOutput = await getStackOutput({
            folder: "apps/website",
            env: params.env,
            cwd: params.projectFolder
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

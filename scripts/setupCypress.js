const path = require("path");
const loadJson = require("load-json-file");
const writeJson = require("write-json-file");
const fs = require("fs");
const { green } = require("chalk");
const getState = require("./getState");
const { argv } = require("yargs");

const PROJECT_FOLDER = ".";

const params = {
    env: argv.env || "prod",
    force: argv.force || false
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
            console.log(`⚠️  ${green("cypress.json")} already exists, skipping.`);
            process.exit(0);
        }
    } else {
        fs.copyFileSync(cypressExampleConfigPath, cypressConfigPath);
    }

    const cypressConfig = await loadJson.sync(cypressConfigPath);

    const apiStateFile = getState("api", params.env);
    cypressConfig.env.API_URL = apiStateFile.outputs.cdn.url;
    cypressConfig.env.GRAPHQL_API_URL = apiStateFile.outputs.cdn.url + "/graphql";

    cypressConfig.env.AWS_COGNITO_USER_POOL_ID = apiStateFile.outputs.cognito.userPool.Id;
    cypressConfig.env.AWS_COGNITO_CLIENT_ID = apiStateFile.outputs.cognito.appClients[0].ClientId;

    // If testing with "local" stack, use "localhost" for the app URLs, otherwise fetch from state files.
    if (params.env === "local") {
        const adminUrl = "http://localhost:3001";
        const siteUrl = "http://localhost:3000";
        cypressConfig.baseUrl = adminUrl + "/admin";
        cypressConfig.env.SITE_URL = siteUrl;
        cypressConfig.env.ADMIN_URL = adminUrl + "/admin";
    } else {
        const appsStateFile = getState("apps", params.env);
        cypressConfig.baseUrl = appsStateFile.outputs.cdn.url + "/admin";
        cypressConfig.env.SITE_URL = appsStateFile.outputs.cdn.url;
        cypressConfig.env.ADMIN_URL = appsStateFile.outputs.cdn.url + "/admin";
    }

    await writeJson(cypressConfigPath, cypressConfig);

    console.log(
        `✅️ Created cypress.json config file! To open Cypress, just run "cypress open" in your terminal.`
    );

    console.log("ℹ️ Created config:");
    console.log(JSON.stringify(cypressConfig, null, 4));
})();

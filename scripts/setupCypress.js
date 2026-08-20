import path from "node:path";
import fs from "node:fs";
import chalk from "chalk";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { execSync } from "node:child_process";

const { green, red } = chalk;
const argv = yargs(hideBin(process.argv)).argv;
const args = {
    env: argv.env || "dev",
    force: argv.force || false,
    localhost: argv.localhost || false,
    projectFolder: argv.projectFolder || null,
    // Self-hosted (server) projects have no Pulumi state and no Cognito, so the URLs cannot be
    // read from deployment output. Pass them explicitly instead.
    apiUrl: argv.apiUrl || null,
    adminUrl: argv.adminUrl || null
};

/**
 * Prepares cypress.config.ts config by reading values from state files and populating necessary variables.
 * Pass "--env" to specify from which environment in the ".webiny" folder you want to read.
 * Pass "--force" if you want to allow overwriting existing cypress.config.ts config file.
 * Pass "--project-folder" to specify from which project you'd like to set up configuration against
 * Pass "--api-url" and "--admin-url" for a self-hosted (server) project, which has no deployment
 * output to read from. Cognito values are left empty - self-hosted uses its own identity provider.
 */
(async () => {
    if (args.projectFolder) {
        if (!fs.existsSync(args.projectFolder)) {
            console.log(
                `Could not find specified project (received ${red(args.projectFolder)}, full path ${red(path.resolve(args.projectFolder))}).`
            );
            process.exit(1);
        }
    }

    const cypressExampleConfigPath = path.resolve("example.cypress.config.ts");
    const cypressConfigPath = path.resolve("cypress-tests/cypress.config.ts");
    if (fs.existsSync(cypressConfigPath)) {
        if (args.force) {
            fs.unlinkSync(cypressConfigPath);
            fs.copyFileSync(cypressExampleConfigPath, cypressConfigPath);
        } else {
            console.log(`⚠️  ${green("cypress.config.ts")} already exists, exiting.`);
            process.exit(0);
        }
    } else {
        fs.copyFileSync(cypressExampleConfigPath, cypressConfigPath);
    }

    let cypressConfig = fs.readFileSync(cypressConfigPath, "utf8");

    if (args.apiUrl) {
        // Self-hosted (server): no `webiny output` to read, and no Cognito. The placeholders are
        // still substituted (with empty strings) so the generated config stays valid TypeScript.
        cypressConfig = cypressConfig.replaceAll("{API_URL}", args.apiUrl);
        cypressConfig = cypressConfig.replaceAll("{AWS_COGNITO_USER_POOL_ID}", "");
        cypressConfig = cypressConfig.replaceAll("{AWS_COGNITO_CLIENT_ID}", "");
    } else {
        const stdout = execSync(`yarn webiny output api --env ${args.env} --json`, {
            encoding: "utf-8",
            stdio: "pipe",
            cwd: args.projectFolder || process.cwd()
        });

        const apiOutput = JSON.parse(stdout);

        cypressConfig = cypressConfig.replaceAll("{API_URL}", apiOutput.apiUrl);

        cypressConfig = cypressConfig.replaceAll(
            "{AWS_COGNITO_USER_POOL_ID}",
            apiOutput.cognitoUserPoolId
        );
        cypressConfig = cypressConfig.replaceAll(
            "{AWS_COGNITO_CLIENT_ID}",
            apiOutput.cognitoAppClientId
        );
    }

    // If testing with "local" stack, use "localhost" for the app URLs, otherwise fetch from state files.
    if (args.adminUrl) {
        cypressConfig = cypressConfig.replaceAll("{ADMIN_URL}", args.adminUrl);
    } else if (args.localhost) {
        const adminUrl = "http://localhost:3001";
        cypressConfig = cypressConfig.replaceAll("{ADMIN_URL}", adminUrl);
    } else {
        const stdout = execSync(`yarn webiny output admin --env ${args.env} --json`, {
            encoding: "utf-8",
            stdio: "pipe",
            cwd: args.projectFolder || process.cwd()
        });

        const adminOutput = JSON.parse(stdout);

        cypressConfig = cypressConfig.replaceAll("{ADMIN_URL}", adminOutput.appUrl);
    }

    fs.writeFileSync(cypressConfigPath, cypressConfig, "utf8");

    console.log(
        `${green("✔")} Created ${green(
            "cypress.config.ts"
        )} config file! To open Cypress, just run ${green("cypress open")} in your terminal.`
    );

    console.log(`Created config:`);
    console.log(cypressConfig);
})();

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
    hostingType: argv.hostingType || "aws",
    apiUrl: argv.apiUrl || null,
    adminUrl: argv.adminUrl || null
};

const readWebinyOutput = (app, { env, projectFolder }) => {
    const stdout = execSync(`yarn webiny output ${app} --env ${env} --json`, {
        encoding: "utf-8",
        stdio: "pipe",
        cwd: projectFolder || process.cwd()
    });

    return JSON.parse(stdout);
};

/**
 * One factory per hosting type, each returning the full set of values substituted into
 * example.cypress.config.ts. Adding a hosting type means adding a factory here, rather than
 * threading another flag through the substitution code.
 */
const configValueFactories = {
    // AWS: everything is read back from the deployed stacks' output.
    aws: options => {
        const api = readWebinyOutput("api", options);

        // With a "local" stack the Admin app is served from localhost rather than from a bucket.
        const adminUrl = options.localhost
            ? "http://localhost:3001"
            : readWebinyOutput("admin", options).appUrl;

        return {
            API_URL: api.apiUrl,
            ADMIN_URL: adminUrl,
            AWS_COGNITO_USER_POOL_ID: api.cognitoUserPoolId,
            AWS_COGNITO_CLIENT_ID: api.cognitoAppClientId
        };
    },

    // Self-hosted ("server"): the project is not deployed, so there is no output to read - the URLs
    // are passed in. It also has its own identity provider, so the Cognito values are blank; they
    // are still substituted so the generated config stays valid TypeScript.
    server: options => {
        if (!options.apiUrl || !options.adminUrl) {
            console.log(
                `${red("--api-url")} and ${red("--admin-url")} are required for ${green("--hosting-type server")}.`
            );
            process.exit(1);
        }

        return {
            API_URL: options.apiUrl,
            ADMIN_URL: options.adminUrl,
            AWS_COGNITO_USER_POOL_ID: "",
            AWS_COGNITO_CLIENT_ID: ""
        };
    }
};

/**
 * Prepares cypress.config.ts config by populating the necessary variables for a given hosting type.
 * Pass "--env" to specify from which environment in the ".webiny" folder you want to read.
 * Pass "--force" if you want to allow overwriting existing cypress.config.ts config file.
 * Pass "--project-folder" to specify from which project you'd like to set up configuration against
 * Pass "--hosting-type" to pick the value factory: "aws" (default) or "server" (self-hosted).
 * Pass "--api-url" and "--admin-url" with "--hosting-type server", which has no deployment output.
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

    const createConfigValues = configValueFactories[args.hostingType];
    if (!createConfigValues) {
        console.log(
            `Unknown hosting type ${red(args.hostingType)} (expected ${Object.keys(
                configValueFactories
            )
                .map(key => green(key))
                .join(" or ")}).`
        );
        process.exit(1);
    }

    // Resolved before the config file is touched, so a bad invocation cannot leave a
    // half-substituted cypress.config.ts behind.
    const values = createConfigValues(args);

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
    for (const [placeholder, value] of Object.entries(values)) {
        cypressConfig = cypressConfig.replaceAll(`{${placeholder}}`, value);
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

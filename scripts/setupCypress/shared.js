import path from "node:path";
import fs from "node:fs";
import chalk from "chalk";
import { execSync } from "node:child_process";

const { green, red } = chalk;

export const EXAMPLE_CONFIG_PATH = () => path.resolve("example.cypress.config.ts");
export const CONFIG_PATH = () => path.resolve("cypress-tests/cypress.config.ts");

/** Reads a deployed app's Pulumi output. Only meaningful for the AWS hosting type. */
export const readWebinyOutput = (app, { env, projectFolder }) => {
    const stdout = execSync(`yarn webiny output ${app} --env ${env} --json`, {
        encoding: "utf-8",
        stdio: "pipe",
        cwd: projectFolder || process.cwd()
    });

    return JSON.parse(stdout);
};

export const assertProjectFolder = projectFolder => {
    if (!projectFolder) {
        return;
    }

    if (!fs.existsSync(projectFolder)) {
        console.log(
            `Could not find specified project (received ${red(projectFolder)}, full path ${red(path.resolve(projectFolder))}).`
        );
        process.exit(1);
    }
};

/**
 * Substitutes the given values into example.cypress.config.ts and writes cypress.config.ts.
 *
 * `values` is keyed by placeholder name without the braces, so `{ API_URL: "..." }` replaces
 * every `{API_URL}`. Callers resolve their values BEFORE calling this, so a bad invocation cannot
 * leave a half-substituted config on disk.
 */
export const writeCypressConfig = ({ values, force }) => {
    const configPath = CONFIG_PATH();

    if (fs.existsSync(configPath)) {
        if (!force) {
            console.log(`⚠️  ${green("cypress.config.ts")} already exists, exiting.`);
            process.exit(0);
        }
        fs.unlinkSync(configPath);
    }

    fs.copyFileSync(EXAMPLE_CONFIG_PATH(), configPath);

    let cypressConfig = fs.readFileSync(configPath, "utf8");
    for (const [placeholder, value] of Object.entries(values)) {
        cypressConfig = cypressConfig.replaceAll(`{${placeholder}}`, value);
    }

    fs.writeFileSync(configPath, cypressConfig, "utf8");

    console.log(
        `${green("✔")} Created ${green("cypress.config.ts")} config file! To open Cypress, just run ${green("cypress open")} in your terminal.`
    );
    console.log(`Created config:`);
    console.log(cypressConfig);
};

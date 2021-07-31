#!/usr/bin/env node
const { red, cyan, green } = require("chalk");
const argv = require("yargs").argv;

const { Octokit } = require("@octokit/rest");

/**
 * A simple script that triggers GitHub workflows.
 */

(async () => {
    try {
        const owner = 'webiny';
        const repo = 'webiny-js';
        const token = argv.token || process.env.GH_TOKEN;
        if (!token) {
            throw new Error(`GitHub token is missing.`);
        }

        const octokit = new Octokit({
            auth: token
        });

        console.log(cyan(`Triggering ${green(argv.event)} worfklow...`));

        await octokit.repos.createDispatchEvent({
            owner,
            repo,
            event_type: argv.event,
            client_payload: typeof argv.payload === "string" ? JSON.parse(argv.payload) : {}
        });

        console.log(green("GitHub workflow successfully triggered."));
        console.log(green("See https://github.com/webiny/webiny-js/actions for action details."));
    } catch (e) {
        console.log(red("Something went wrong:"));
        console.log(red(e.message));
    }
})();

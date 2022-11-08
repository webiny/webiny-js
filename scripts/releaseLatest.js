#!/usr/bin/env node
const { red, cyan, green } = require("chalk");
const argv = require("yargs").argv;

const { Octokit } = require("@octokit/rest");

/**
 * A simple script that will trigger release-latest GitHub workflow.
 * Latest releases are deployed from the "v5" branch.
 */

const RELEASE_BRANCH = "stable";

(async () => {
    try {
        if (!argv.token) {
            throw new Error(
                `"--token" argument missing. Make sure it contains a valid GitHub access token.`
            );
        }

        const octokit = new Octokit({
            auth: argv.token
        });

        console.log(red(`⚠️⚠️⚠️ I hope you know what you're doing.`));
        console.log(
            cyan(
                `Triggering a GitHub workflow that will release and publish Webiny of the "${RELEASE_BRANCH}" branch.`
            )
        );

        console.log(cyan(`Triggering...`));

        await octokit.repos.createDispatchEvent({
            owner: "webiny",
            repo: "webiny-js",
            event_type: "release-latest",
            client_payload: {
                branch: RELEASE_BRANCH
            }
        });

        console.log(green("GitHub workflow successfully triggered."));
        console.log(green("See https://github.com/webiny/webiny-js/actions for action details."));
    } catch (e) {
        console.log(red("Something went wrong:"));
        console.log(red(e.message));
    }
})();

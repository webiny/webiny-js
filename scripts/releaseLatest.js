#!/usr/bin/env node
const { red, cyan, green } = require("chalk");
const argv = require("yargs").argv;

const { Octokit } = require("@octokit/rest");

/**
 * A simple script that will trigger release-latest GitHub workflow, which will checkout the branch passed via the
 * --branch argument, and release and publish all packages with the "latest" tag.
 *
 * Warning: only use this when the "release-x.y.z" branch has been completely tested by the team, and
 * you're absolutely sure the code that's about to be released is fully working and production ready.
 */

(async () => {
    try {
        if (!argv.token) {
            throw new Error(`"--token" argument missing. Make sure it contains a valid GitHub access token.`);
        }

        if (!argv.branch) {
            throw new Error(`"--branch" argument missing.`);
        }

        if (!argv.branch.startsWith("release-")) {
            throw new Error(
                `--branch argument must be set to a branch name that starts with "release-", for example: "release-4.2.0".`
            );
        }

        const octokit = new Octokit({
            auth: argv.token
        });

        console.log(red(`⚠️⚠️⚠️ I hope you know what you're doing.`));
        console.log(
            cyan(
                `Triggering a GitHub workflow that will release and publish Webiny of the "${argv.branch}" branch.`
            )
        );

        console.log(cyan(`Triggering...`));

        await octokit.repos.createDispatchEvent({
            owner: "webiny",
            repo: "webiny-js",
            event_type: "release-latest",
            client_payload: {
                branch: argv.branch
            }
        });

        console.log(green("GitHub workflow successfully triggered."));
        console.log(green("See https://github.com/webiny/webiny-js/actions for action details."));
    } catch (e) {
        console.log(red("Something went wrong:"));
        console.log(red(e.message));
    }
})();

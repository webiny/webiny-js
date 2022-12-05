#!/usr/bin/env node
const { Octokit } = require("@octokit/rest");
const { ConsoleLogger } = require("../ConsoleLogger");
const yargs = require("yargs");

/**
 * A simple script that will trigger a "release" GitHub workflow.
 */

(async () => {
    const logger = new ConsoleLogger();
    const { branch, type, token, tag } = yargs.argv;

    if (!branch) {
        throw Error(`"--branch" argument missing. Specify a branch you want to release.`);
    }

    if (!type) {
        throw Error(`"--type" argument missing. Specify one of: latest, beta, unstable.`);
    }

    try {
        if (!token) {
            throw new Error(
                `"--token" argument missing. Make sure it contains a valid GitHub access token.`
            );
        }

        logger.info("Branch: %s", branch);
        logger.info("Type: %s", type);
        if (tag) {
            logger.info("Tag: %s", tag);
        }

        const octokit = new Octokit({ auth: `token ${token}` });

        await octokit.repos.createDispatchEvent({
            owner: "webiny",
            repo: "webiny-js",
            event_type: "release",
            client_payload: {
                branch,
                type,
                tag
            }
        });

        logger.success("GitHub workflow triggered successfully!");
        logger.info("See action details: %s", "https://github.com/webiny/webiny-js/actions");
    } catch (e) {
        console.log(e);
        logger.error("Something went wrong: %s", e.message);
    }
})();

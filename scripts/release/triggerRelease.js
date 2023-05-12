#!/usr/bin/env node
const yargs = require("yargs");
const { Octokit } = require("@octokit/rest");
const { ConsoleLogger } = require("../ConsoleLogger");
const { checkReleaseType } = require("./releaseTypes");

/**
 * A simple script that will trigger the "release" GitHub workflow.
 */

(async () => {
    const { branch, type, token, tag } = yargs.argv;

    try {
        if (!branch) {
            throw Error(`"--branch" argument missing. Specify a branch you want to release.`);
        }

        if (!type) {
            throw Error(`"--type" argument missing. Specify one of: latest, beta, unstable.`);
        }

        checkReleaseType(type);

        if (!token) {
            throw Error(
                `"--token" argument missing. Make sure it contains a valid GitHub access token.`
            );
        }

        const logger = new ConsoleLogger();

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
        logger.error(e.message);
    }
})();

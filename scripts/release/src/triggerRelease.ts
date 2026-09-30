#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { Octokit } from "@octokit/rest";
import { ConsoleLogger } from "./ConsoleLogger.js";
import { checkReleaseType } from "./releaseTypes.js";

const cli = yargs(hideBin(process.argv));

// Disable default handling of `--version` parameter.
cli.version(false);

interface ReleaseArgs {
    branch?: string;
    type?: string;
    token?: string;
    tag?: string;
    version?: string;
    createGithubRelease?: boolean | string;
}

/**
 * A simple script that will trigger the "v6 Custom Release" GitHub workflow (`release-v6` event).
 */

(async () => {
    const { branch, type, token, tag, version, createGithubRelease } =
        (await cli.argv) as ReleaseArgs;
    const logger = new ConsoleLogger();

    try {
        if (!branch) {
            throw Error(`"--branch" argument missing. Specify a branch you want to release.`);
        }

        if (!type) {
            throw Error(
                `"--type" argument missing. Specify one of: latest, beta, alpha, unstable, verdaccio, release.`
            );
        }

        checkReleaseType(type);

        if (!token) {
            throw Error(
                `"--token" argument missing. Make sure it contains a valid GitHub access token.`
            );
        }

        logger.info("Branch: %s", branch);
        logger.info("Type: %s", type);

        if (tag) {
            logger.info("Tag: %s", tag);
        }

        if (version) {
            logger.info("Version: %s", version);
        }

        if (createGithubRelease) {
            logger.info("Create Github Release: %s", createGithubRelease);
        }

        const octokit = new Octokit({ auth: token });

        await octokit.repos.createDispatchEvent({
            owner: "webiny",
            repo: "webiny-js",
            event_type: "release-v6",
            client_payload: {
                branch,
                type,
                tag,
                version,
                createGithubRelease
            }
        });

        logger.success("GitHub workflow triggered successfully!");
        logger.info("See action details: %s", "https://github.com/webiny/webiny-js/actions");
    } catch (e) {
        logger.error(e.message);
        process.exit(1);
    }
})();

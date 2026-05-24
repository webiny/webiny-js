#!/usr/bin/env node
import semver from "semver";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { ConsoleLogger } from "./ConsoleLogger";
import { getReleaseType } from "./releaseTypes";

const cli = yargs(hideBin(process.argv));

// Disable default handling of `--version` parameter.
cli.version(false);

interface ReleaseArgs {
    type?: string;
    tag?: string;
    preid?: string;
    gitReset?: boolean;
    version?: string;
    createGithubRelease?: boolean | string;
    printVersion?: boolean;
    dryRun?: boolean;
}

async function runRelease() {
    const {
        type,
        tag,
        preid,
        gitReset = true,
        version,
        createGithubRelease,
        printVersion,
        dryRun
    } = cli.argv as ReleaseArgs;

    if (!type) {
        throw Error(`Missing required "--type" option.`);
    }

    if (version) {
        if (!semver.valid(version)) {
            throw Error(`"--version" must be a valid semver string.`);
        }

        const parsed = semver.parse(version)!;
        if (parsed.prerelease.length > 0) {
            throw Error(`"--version" must be a clean semver (e.g., 6.4.0), not a prerelease.`);
        }
    }

    const Release = getReleaseType(type);

    const logger = new ConsoleLogger();
    const release = new Release(logger);

    if (tag) {
        release.setTag(tag);
    }

    if (preid) {
        release.setPreid(preid);
    }

    if (version) {
        release.setVersion(version);
    }

    release.setResetAllChanges(Boolean(gitReset));

    if (createGithubRelease !== undefined) {
        release.setCreateGithubRelease(createGithubRelease);
    }

    if (dryRun) {
        release.setDryRun(true);
    }

    if (printVersion) {
        await release.printVersion();
    } else {
        await release.execute();
    }
}

(async () => {
    try {
        await runRelease();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();

const yargs = require("yargs");
const { ConsoleLogger } = require("../ConsoleLogger");
const { getReleaseType } = require("./releaseTypes");

// Disable default handling of `--version` parameter.
yargs.version(false);

async function runRelease() {
    const { type, tag, gitReset = true, version, createGithubRelease, printVersion } = yargs.argv;

    console.log({ type, tag, gitReset, version });
    if (!type) {
        throw Error(`Missing required "--type" option.`);
    }

    const Release = getReleaseType(type);

    const logger = new ConsoleLogger();
    const release = new Release(logger);

    if (tag) {
        release.setTag(tag);
    }

    if (version) {
        release.setVersion(version);
    }

    release.setResetAllChanges(Boolean(gitReset));

    if (createGithubRelease) {
        release.setCreateGithubRelease(createGithubRelease);
    }

    if (printVersion) {
        const { version } = await release.versionPackages();

        console.log(version);
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

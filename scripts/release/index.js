const yargs = require("yargs");
const { ConsoleLogger } = require("../ConsoleLogger");
const { getReleaseType } = require("./releaseTypes");

async function runRelease() {
    const { type, tag, gitReset } = yargs.argv;
    if (!type) {
        throw Error(`Missing required "--type" option.`);
    }

    const Release = getReleaseType(type);

    const logger = new ConsoleLogger();
    const release = new Release(logger);

    if (tag) {
        release.setTag(tag);
    }

    if (gitReset) {
        release.setResetAllChanges(gitReset);
    }

    await release.execute();
}

(async () => {
    try {
        await runRelease();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();

const yargs = require("yargs");
const { LatestRelease } = require("./LatestRelease");
const { BetaRelease } = require("./BetaRelease");
const { UnstableRelease } = require("./UnstableRelease");
const { VerdaccioRelease } = require("./VerdaccioRelease");
const { ConsoleLogger } = require("../ConsoleLogger");

const releaseTypes = {
    latest: LatestRelease,
    beta: BetaRelease,
    unstable: UnstableRelease,
    verdaccio: VerdaccioRelease
};

(async () => {
    const { type, tag } = yargs.argv;
    if (!type) {
        throw Error(`Missing required "--type" option.`);
    }

    const Release = releaseTypes[type];

    if (!Release) {
        const possibleTypes = Object.keys(releaseTypes).join(", ");
        throw Error(`Unrecognized type "${type}". Specify one of: ${possibleTypes}`);
    }

    const logger = new ConsoleLogger();
    const release = new Release(logger);

    if (tag) {
        release.setTag(tag);
    }

    await release.execute();
})();

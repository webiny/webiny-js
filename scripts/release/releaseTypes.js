const { LatestRelease } = require("./LatestRelease");
const { BetaRelease } = require("./BetaRelease");
const { UnstableRelease } = require("./UnstableRelease");
const { VerdaccioRelease } = require("./VerdaccioRelease");

const releaseTypes = {
    latest: LatestRelease,
    beta: BetaRelease,
    unstable: UnstableRelease,
    verdaccio: VerdaccioRelease
};

const checkReleaseType = type => {
    if (!releaseTypes[type]) {
        const possibleTypes = Object.keys(releaseTypes).join(", ");
        throw Error(`Unrecognized release type "${type}". Specify one of: ${possibleTypes}.`);
    }
};

const getReleaseType = type => {
    checkReleaseType(type);

    return releaseTypes[type];
};

module.exports = { getReleaseType, checkReleaseType };

import { LatestRelease } from "./LatestRelease.js";
import { BetaRelease } from "./BetaRelease.js";
import { AlphaRelease } from "./AlphaRelease.js";
import { UnstableRelease } from "./UnstableRelease.js";
import { VerdaccioRelease } from "./VerdaccioRelease.js";
import { ExactRelease } from "./ExactRelease.js";
import { Release } from "./Release.js";

type ReleaseClass = typeof Release;

const releaseTypes: Record<string, ReleaseClass> = {
    latest: LatestRelease,
    beta: BetaRelease,
    alpha: AlphaRelease,
    unstable: UnstableRelease,
    verdaccio: VerdaccioRelease,
    release: ExactRelease
};

export const checkReleaseType = (type: string): void => {
    if (!releaseTypes[type]) {
        const possibleTypes = Object.keys(releaseTypes).join(", ");
        throw Error(`Unrecognized release type "${type}". Specify one of: ${possibleTypes}.`);
    }
};

export const getReleaseType = (type: string): ReleaseClass => {
    checkReleaseType(type);

    return releaseTypes[type];
};

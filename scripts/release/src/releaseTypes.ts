import { LatestRelease } from "./LatestRelease";
import { BetaRelease } from "./BetaRelease";
import { AlphaRelease } from "./AlphaRelease";
import { UnstableRelease } from "./UnstableRelease";
import { VerdaccioRelease } from "./VerdaccioRelease";
import { Release } from "./Release";

type ReleaseClass = typeof Release;

const releaseTypes: Record<string, ReleaseClass> = {
    latest: LatestRelease,
    beta: BetaRelease,
    alpha: AlphaRelease,
    unstable: UnstableRelease,
    verdaccio: VerdaccioRelease
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

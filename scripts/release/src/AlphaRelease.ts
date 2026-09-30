import { BetaRelease } from "./BetaRelease.js";

/**
 * An alpha release works exactly like a beta release (a prerelease published under
 * its version's own NPM dist-tag, no GitHub release), but with the "alpha" preid, so
 * `6.6.0-alpha.8` goes under `alpha-6.6.0`. Used to ship early previews of upcoming
 * features (e.g. SQLite / standalone) as `x.y.z-alpha.n` before a regular release.
 */
export class AlphaRelease extends BetaRelease {
    protected override releaseName = "alpha";
}

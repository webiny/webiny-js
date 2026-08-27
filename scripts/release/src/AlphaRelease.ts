import { BetaRelease } from "./BetaRelease";

/**
 * An alpha release works exactly like a beta release (a prerelease published under
 * its own NPM dist-tag, no GitHub release), but under the "alpha" dist-tag/preid.
 * Used to ship early previews of upcoming features (e.g. SQLite / self-hosted) as
 * `x.y.z-alpha.n` before a regular release.
 */
export class AlphaRelease extends BetaRelease {
    protected override releaseName = "alpha";

    constructor(logger: any) {
        super(logger);
        this.setTag("alpha");
    }
}

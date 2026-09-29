import semver from "semver";
import { Release } from "./Release";

/**
 * A release where everything is specified explicitly: the exact `--version` (prereleases
 * included, e.g. `6.4.12-beta.6`) and the NPM `--tag`. Nothing is computed or defaulted.
 */
export class ExactRelease extends Release {
    static override allowPrereleaseVersion = true;

    constructor(logger: any) {
        super(logger);
        this.setCreateGithubRelease(false);
    }

    override async computeVersion(): Promise<string> {
        if (!this.version) {
            throw Error(`"--version" is required for exact releases.`);
        }

        if (!semver.valid(this.version)) {
            throw Error(`"--version" must be a valid semver string.`);
        }

        return this.version;
    }

    protected override validateConfig() {
        if (!this.distTag) {
            throw Error(`"--tag" is required for exact releases.`);
        }

        super.validateConfig();
    }
}

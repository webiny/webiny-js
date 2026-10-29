import semver from "semver";
import { Release } from "./Release";
import { prereleaseDistTag } from "./prereleaseDistTag";

/**
 * A release where the exact `--version` is specified (prereleases included, e.g.
 * `6.4.12-beta.6`). Without `--tag`, a prerelease goes under its version's own dist-tag, the
 * same one beta and alpha releases use (`beta-6.4.12`). A clean version needs an explicit `--tag`.
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

        const [preid] = semver.prerelease(this.version) || [];
        if (!this.distTag && typeof preid === "string") {
            const base = `${semver.major(this.version)}.${semver.minor(this.version)}.${semver.patch(this.version)}`;
            this.setTag(prereleaseDistTag(preid, base));
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

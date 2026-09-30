import semver from "semver";
import { Release } from "./Release";

export class BetaRelease extends Release {
    constructor(logger: any) {
        super(logger);
        this.setCreateGithubRelease(false);
    }

    override async computeVersion(): Promise<string> {
        if (!this.version) {
            throw Error(`"--version" is required for beta releases.`);
        }

        const preid = this.preid || this.distTag || "beta";

        // Without an explicit `--tag`, every prerelease of a version shares a dist-tag named after
        // that version (`6.4.12-beta.6` goes under `beta-6.4.12`), so prereleases of two versions
        // built in parallel never move each other's tag. NPM rejects tags that parse as a semver
        // range, which is why the tag can't be a bare `6.4.12`.
        if (!this.distTag) {
            this.setTag(`${preid}-${this.version}`);
        }

        const distTags = await this.fetchDistTags();
        const tagVersion = distTags[this.distTag!];

        if (tagVersion) {
            const currentBase = `${semver.major(tagVersion)}.${semver.minor(tagVersion)}.${semver.patch(tagVersion)}`;

            if (currentBase === this.version) {
                const prerelease = semver.prerelease(tagVersion);
                const suffix = prerelease && typeof prerelease[1] === "number" ? prerelease[1] : -1;
                return `${this.version}-${preid}.${suffix + 1}`;
            }
        }

        return `${this.version}-${preid}.0`;
    }
}

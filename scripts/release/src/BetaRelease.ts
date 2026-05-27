import semver from "semver";
import { Release } from "./Release";

export class BetaRelease extends Release {
    constructor(logger: any) {
        super(logger);
        this.setTag("beta");
        this.setCreateGithubRelease(false);
    }

    override async computeVersion(): Promise<string> {
        if (!this.version) {
            throw Error(`"--version" is required for beta releases.`);
        }

        const preid = this.preid || this.distTag || "beta";
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

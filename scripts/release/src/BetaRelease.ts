import semver from "semver";
import { Release } from "./Release.js";
import { highestPrereleaseNumber, prereleaseDistTag } from "./prereleaseDistTag.js";

export class BetaRelease extends Release {
    // Name of the release, used for the default preid and error messages. Subclasses
    // (e.g. AlphaRelease) override this to reuse the same prerelease versioning logic.
    protected releaseName = "beta";

    constructor(logger: any) {
        super(logger);
        this.setCreateGithubRelease(false);
    }

    override async computeVersion(): Promise<string> {
        if (!this.version) {
            throw Error(`"--version" is required for ${this.releaseName} releases.`);
        }

        const preid = this.preid || this.distTag || this.releaseName;

        if (!this.distTag) {
            this.setTag(prereleaseDistTag(preid, this.version));
        }

        const [distTags, publishedVersions] = await Promise.all([
            this.fetchDistTags(),
            this.fetchPublishedVersions()
        ]);

        // The dist-tag alone isn't enough: a version's own tag is missing for the first release
        // under it, even when earlier prereleases of that version went out under an older tag.
        // Counting from the tag would restart at .0 and collide with what's already on NPM.
        let suffix = highestPrereleaseNumber(publishedVersions, this.version, preid);

        const tagVersion = distTags[this.distTag!];
        if (tagVersion) {
            const currentBase = `${semver.major(tagVersion)}.${semver.minor(tagVersion)}.${semver.patch(tagVersion)}`;

            if (currentBase === this.version) {
                const prerelease = semver.prerelease(tagVersion);
                if (prerelease && typeof prerelease[1] === "number") {
                    suffix = Math.max(suffix, prerelease[1]);
                }
            }
        }

        return `${this.version}-${preid}.${suffix + 1}`;
    }
}

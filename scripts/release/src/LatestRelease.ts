import { Release } from "./Release";
import semver from "semver";

export class LatestRelease extends Release {
    defaultTag = "latest";

    constructor(logger: any) {
        super(logger);
        this.setTag(this.defaultTag);
        this.setSourceTag("beta");

        this.setVersion(mostRecentVersion => {
            // Check if specific version is enforced via an ENV variable.
            const envVersion = process.env.LATEST_VERSION;
            if (envVersion && semver.valid(envVersion)) {
                return envVersion;
            }

            // If most recent version is a prerelease version, coerce it to a non-prerelease version.
            const currentVersion = semver.parse(mostRecentVersion);
            if (currentVersion && currentVersion.prerelease.length > 0) {
                return semver.coerce(mostRecentVersion)?.version!;
            }

            // Determine version using conventional commits specs.
            return "--conventional-commits";
        });
        // By setting `latest`, this release will be marked as `latest` on Github
        this.setCreateGithubRelease("latest");
    }

    override setTag(tag: string) {
        if (tag !== this.defaultTag) {
            this.logger.warning(
                "Latest release can only be published using the %s tag; the requested %s tag will be ignored.",
                this.defaultTag,
                tag
            );

            return;
        }

        super.setTag(tag);
    }
}

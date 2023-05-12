const { Release } = require("./Release");
const semver = require("semver");

class LatestRelease extends Release {
    defaultTag = "latest";

    constructor(logger) {
        super(logger);
        this.setTag(this.defaultTag);

        this.setVersion(mostRecentVersion => {
            // Check if specific version is enforced via an ENV variable.
            const envVersion = process.env.LATEST_VERSION;
            if (envVersion && semver.valid(envVersion)) {
                return envVersion;
            }

            // If most recent version is a prerelease version, coerce it to a non-prerelease version.
            const currentVersion = semver.parse(mostRecentVersion);
            if (currentVersion.prerelease.length > 0) {
                return semver.coerce(mostRecentVersion);
            }

            // Determine version using conventional commits specs.
            return "--conventional-commits";
        });
        this.setCreateGithubRelease(true);
    }

    setTag(tag) {
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

module.exports = { LatestRelease };

const { Release } = require("./Release");

class LatestRelease extends Release {
    defaultTag = "latest";

    constructor(logger) {
        super(logger);
        this.setTag(this.defaultTag);

        const VERSION = process.env.LATEST_VERSION || "--conventional-graduate";

        this.setVersion(VERSION);
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

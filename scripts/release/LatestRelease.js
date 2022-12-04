const { Release } = require("./Release");

class LatestRelease extends Release {
    constructor(logger) {
        super(logger);
        this.setTag("latest");
        this.setVersion("--conventional-graduate");
        this.setCreateGithubRelease(true);
    }

    setTag(tag) {
        if (tag !== "latest") {
            this.logger.warning(
                "Latest release can only be published using the %s tag; the requested %s tag will be ignored.",
                "latest",
                tag
            );

            return;
        }

        super.setTag(tag);
    }
}

module.exports = { LatestRelease };

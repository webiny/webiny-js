const { Release } = require("./Release");

class BetaRelease extends Release {
    constructor(logger) {
        super(logger);
        this.setTag("beta");
        this.setVersion(["--conventional-prerelease", "--preid", "beta"]);
        this.setCreateGithubRelease(false);
    }

    setTag(tag) {
        if (tag !== "beta") {
            this.logger.warning(
                "Beta release can only be published using the %s tag; the requested %s tag will be ignored.",
                "beta",
                tag
            );

            return;
        }

        super.setTag(tag);
    }
}

module.exports = { BetaRelease };

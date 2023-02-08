const { Release } = require("./Release");

class BetaRelease extends Release {
    constructor(logger) {
        super(logger);

        const VERSION = process.env.BETA_VERSION || "--conventional-prerelease";

        this.setTag("beta");
        this.setVersion([VERSION, "--preid", "beta"]);
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

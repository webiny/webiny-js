const { Release } = require("scripts/release/Release");

class VerdaccioRelease extends Release {
    defaultTag = "verdaccio";

    constructor(logger) {
        super(logger);
        this.setTag(this.defaultTag);
        this.setVersion(["--conventional-prerelease", "--preid", this.defaultTag]);
        this.setCreateGithubRelease(false);
    }
}

module.exports = { VerdaccioRelease };

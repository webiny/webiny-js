const { Release } = require("./Release");

class VerdaccioRelease extends Release {
    defaultTag = "local-npm";

    constructor(logger) {
        super(logger);
        this.setTag(this.defaultTag);
        this.setVersion(() => {
            return ["--conventional-prerelease", "--preid", this.tag];
        });
        this.setCreateGithubRelease(false);
    }
}

module.exports = { VerdaccioRelease };

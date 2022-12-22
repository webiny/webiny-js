const execa = require("execa");
const { Release } = require("./Release");

class UnstableRelease extends Release {
    protectedTags = ["latest", "beta"];

    constructor(logger) {
        super(logger);
        this.setTag("unstable");
        this.setVersion(async () => {
            const { stdout: commitHash } = await execa("git", ["rev-parse", "--short", "HEAD"]);
            return `0.0.0-${this.tag}.${commitHash}`;
        });
        this.setCreateGithubRelease(false);
    }

    setTag(tag) {
        if (this.protectedTags.includes(tag)) {
            throw Error(`Protected tag "${tag}" can't be used in an unstable release!`);
        }

        super.setTag(tag);
    }
}

module.exports = { UnstableRelease };

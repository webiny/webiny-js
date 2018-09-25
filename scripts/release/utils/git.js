const execa = require("execa");

const git = {
    /**
     * Fetch all commits and tags
     */
    async fetchAll() {
        await execa("git", ["fetch", "--unshallow", "--tags"], { reject: false });
    },

    /**
     * Get the commit SHA for a given tag.
     * @param {string} tagName Tag name for which to retrieve the commit SHA.
     * @return {string} The commit SHA of the tag in parameter or `null`.
     */
    async tagHead(tagName) {
        try {
            return await execa.stdout("git", ["rev-list", "-1", tagName]);
        } catch (err) {
            return null;
        }
    },

    /**
     * Get tags.
     * @return {Array<String>} List of git tags.
     * @throws {Error} If the `git` command fails.
     */
    async tags() {
        return (await execa.stdout("git", ["tag"]))
            .split("\n")
            .map(tag => tag.trim())
            .filter(tag => Boolean(tag));
    },

    /**
     * Verify a tag name is a valid Git reference.
     *
     * @method verifyTagName
     * @param {string} tagName the tag name to verify.
     * @return {boolean} `true` if valid, falsy otherwise.
     */
    async verifyTagName(tagName) {
        try {
            return (await execa("git", ["check-ref-format", `refs/tags/${tagName}`])).code === 0;
        } catch (err) {
            return false;
        }
    },

    /**
     * Verify if the `ref` is in the direct history of the current branch.
     *
     * @param {string} ref The reference to look for.
     *
     * @return {boolean} `true` if the reference is in the history of the current branch, `false` otherwise.
     */
    async isRefInHistory(ref) {
        try {
            return (await execa("git", ["merge-base", "--is-ancestor", ref, "HEAD"])).code === 0;
        } catch (err) {
            return false;
        }
    },

    /**
     * @return {string} the SHA of the HEAD commit.
     */
    async head() {
        return execa.stdout("git", ["rev-parse", "HEAD"]);
    },

    /**
     * @return {string} The value of the remote git URL or `undefined` if remote URL is not set
     */
    async repoUrl() {
        try {
            return await execa.stdout("git", ["remote", "get-url", "origin"]);
        } catch (e) {
            return undefined;
        }
    }
};

module.exports = git;

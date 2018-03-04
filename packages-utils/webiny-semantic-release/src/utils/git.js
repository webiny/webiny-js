import execa from "execa";
import debugFactory from "debug";

const debug = debugFactory("WSR:GIT");

class Git {
    /**
     * Unshallow the git repository (fetch all commits and tags).
     */
    async unshallow() {
        await execa("git", ["fetch", "--unSHAllow", "--tags"], { reject: false });
    }

    /**
     * Get the commit SHA for a given tag.
     * @param {string} tagName Tag name for which to retrieve the commit SHA.
     * @return {string} The commit SHA of the tag in parameter or `null`.
     */
    async tagHead(tagName) {
        try {
            return await execa.stdout("git", ["rev-list", "-1", tagName]);
        } catch (err) {
            debug(err);
        }
    }

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
    }

    /**
     * Tag the commit head on the local repository.
     *
     * @param {String} tagName The name of the tag.
     * @throws {Error} if the tag creation failed.
     */
    async tag(tagName) {
        await execa("git", ["tag", tagName]);
    }

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
            debug(err);
        }
    }

    /**
     * Verify if the `ref` is in the direct history of the current branch.
     *
     * @param {string} ref The reference to look for.
     *
     * @return {boolean} `true` if the reference is in the history of the current branch, falsy otherwise.
     */
    async isRefInHistory(ref) {
        try {
            return (await execa("git", ["merge-base", "--is-ancestor", ref, "HEAD"])).code === 0;
        } catch (err) {
            debug(err);
        }
    }

    /**
     * @return {string} the SHA of the HEAD commit.
     */
    async head() {
        return execa.stdout("git", ["rev-parse", "HEAD"]);
    }

    /**
     * @return {string} The value of the remote git URL.
     */
    async repoUrl() {
        try {
            return await execa.stdout("git", ["remote", "get-url", "origin"]);
        } catch (err) {
            debug(err);
        }
    }

    /**
     * Push to the remote repository.
     *
     * @param {String} origin The remote repository URL.
     * @param {String} branch The branch to push.
     * @throws {Error} if the push failed.
     */
    async push(origin, branch) {
        await execa("git", ["push", "--tags", origin, `HEAD:${branch}`]);
    }
}

export default Git;

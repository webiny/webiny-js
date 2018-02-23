/**
 * This file was borrowed from `semantic-release`.
 * https://github.com/semantic-release/semantic-release/blob/caribou/src/git.js
 * Reason: we did not want to include the entire library as a dependency because of several scripts.
 */

import execa from "execa";
import debugFactory from "debug";

const debug = debugFactory("WSR:GIT");

/**
 * Unshallow the git repository (fetch all commits and tags).
 */
async function unshallow() {
    await execa("git", ["fetch", "--unshallow", "--tags"], { reject: false });
}

/**
 * Get the commit sha for a given tag.
 *
 * @param {string} tagName Tag name for which to retrieve the commit sha.
 *
 * @return {string} The commit sha of the tag in parameter or `null`.
 */
async function gitTagHead(tagName) {
    try {
        return await execa.stdout("git", ["rev-list", "-1", tagName]);
    } catch (err) {
        debug(err);
    }
}

/**
 * @return {Array<String>} List of git tags.
 * @throws {Error} If the `git` command fails.
 */
async function gitTags() {
    return (await execa.stdout("git", ["tag"]))
        .split("\n")
        .map(tag => tag.trim())
        .filter(tag => Boolean(tag));
}

/**
 * Verify if the `ref` is in the direct history of the current branch.
 *
 * @param {string} ref The reference to look for.
 *
 * @return {boolean} `true` if the reference is in the history of the current branch, falsy otherwise.
 */
async function isRefInHistory(ref) {
    try {
        return (await execa("git", ["merge-base", "--is-ancestor", ref, "HEAD"])).code === 0;
    } catch (err) {
        debug(err);
    }
}

/**
 * @return {string} the sha of the HEAD commit.
 */
async function gitHead() {
    return execa.stdout("git", ["rev-parse", "HEAD"]);
}

/**
 * @return {string} The value of the remote git URL.
 */
async function repoUrl() {
    try {
        return await execa.stdout("git", ["remote", "get-url", "origin"]);
    } catch (err) {
        debug(err);
    }
}

/**
 * Tag the commit head on the local repository.
 *
 * @param {String} tagName The name of the tag.
 * @throws {Error} if the tag creation failed.
 */
async function tag(tagName) {
    await execa("git", ["tag", tagName]);
}

/**
 * Push to the remote repository.
 *
 * @param {String} origin The remote repository URL.
 * @param {String} branch The branch to push.
 * @throws {Error} if the push failed.
 */
async function push(origin, branch) {
    await execa("git", ["push", "--tags", origin, `HEAD:${branch}`]);
}

/**
 * Verify a tag name is a valid Git reference.
 *
 * @method verifyTagName
 * @param {string} tagName the tag name to verify.
 * @return {boolean} `true` if valid, falsy otherwise.
 */
async function verifyTagName(tagName) {
    try {
        return (await execa("git", ["check-ref-format", `refs/tags/${tagName}`])).code === 0;
    } catch (err) {
        debug(err);
    }
}

export {
    unshallow,
    gitTagHead,
    gitTags,
    isRefInHistory,
    gitHead,
    repoUrl,
    tag,
    push,
    verifyTagName
};

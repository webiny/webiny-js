/**
 * This file was borrowed from semantic-release.
 * https://github.com/semantic-release/semantic-release/blob/caribou/src/get-commits.js
 * Reason: we did not want to include the entire library as a dependency because of several scripts.
 */
const gitLogParser = require("git-log-parser");
const getStream = require("get-stream");
const execa = require("execa");

/**
 * Retrieve the list of commits since the commit sha associated with the last release, or all the commits of the current branch if there is no last released version.
 *
 * @param {String} gitHead The commit sha associated with the last release.
 * @param {String} branch The branch to release from.
 * @param {Object} logger Global logger.
 *
 * @return {Promise<Array<Object>>} The list of commits on the branch `branch` since the last release.
 */
module.exports = async (gitHead, branch, logger) => {
    if (gitHead) {
        logger.log("Use gitHead: %s", gitHead);
    } else {
        logger.log("No previous release found, retrieving all commits");
    }

    Object.assign(gitLogParser.fields, {
        hash: "H",
        message: "B",
        gitTags: "d",
        committerDate: { key: "ci", type: Date }
    });

    const commits = await Promise.all(
        (await getStream.array(
            gitLogParser.parse({ _: `${gitHead ? gitHead + ".." : ""}HEAD` })
        )).filter(commit => commit.tree.long)
    );

    for (let i = 0; i < commits.length; i++) {
        const files = await execa.stdout("git", [
            "diff-tree",
            "--no-commit-id",
            "--name-only",
            "-r",
            commits[i].commit.long
        ]);
        commits[i].files = files.split("\n");
        commits[i].message = commits[i].message.trim();
        commits[i].gitTags = commits[i].gitTags.trim();
    }
    logger.log("Found %s commits since last release", commits.length);
    return commits;
};

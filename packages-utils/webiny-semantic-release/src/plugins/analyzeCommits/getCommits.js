/**
 * This file was borrowed from semantic-release.
 * https://github.com/semantic-release/semantic-release/blob/caribou/src/get-commits.js
 * Reason: we did not want to include the entire library as a dependency because of several scripts.
 */
import gitLogParser from "git-log-parser";
import getStream from "get-stream";

/**
 * Retrieve the list of commits on the current branch since the commit sha associated with the last release, or all the commits of the current branch if there is no last released version.
 *
 * @param {String} gitHead The commit sha associated with the last release.
 * @param {String} branch The branch to release from.
 * @param {Object} logger Global logger.
 *
 * @return {Promise<Array<Object>>} The list of commits on the branch `branch` since the last release.
 */
export default async (gitHead, branch, logger) => {
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

    const commits = (await getStream.array(
        gitLogParser.parse({ _: `${gitHead ? gitHead + ".." : ""}HEAD` })
    )).map(commit => {
        commit.message = commit.message.trim();
        commit.gitTags = commit.gitTags.trim();
        return commit;
    });
    logger.log("Found %s commits since last release", commits.length);
    return commits;
};

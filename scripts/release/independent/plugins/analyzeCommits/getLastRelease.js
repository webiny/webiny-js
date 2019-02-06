/**
 * This file was borrowed from semantic-release.
 * Reason: we did not want to include the entire library as a dependency because of several scripts.
 */

const { escapeRegExp, template } = require("lodash");
const semver = require("semver");
const pLocate = require("p-locate");

/**
 * Determine the Git tag and version of the last tagged release.
 *
 * - Obtain all the tags referencing commits in the current branch history
 * - Filter out the ones that are not valid semantic version or doesn't match the `tagFormat`
 * - Sort the versions
 * - Retrieve the highest version
 *
 * @param {Object} logger Global logger.
 * @param {Object} git .
 * @return {Promise<Object>} The last tagged release or `undefined` if none is found.
 */
module.exports = ({ logger, git }) => {
    return async tagFormat => {
        // Generate a regex to parse tags formatted with `tagFormat`
        // by replacing the `version` variable in the template by `(.+)`.
        // The `tagFormat` is compiled with space as the `version` as it's an invalid tag character,
        // so it's guaranteed to no be present in the `tagFormat`.
        const tagRegexp = escapeRegExp(template(tagFormat)({ version: " " })).replace(" ", "(.+)");
        const tags = (await git.tags())
            .map(tag => {
                return { gitTag: tag, version: (tag.match(tagRegexp) || new Array(2))[1] };
            })
            .filter(tag => tag.version && semver.valid(semver.clean(tag.version)))
            .sort((a, b) => semver.rcompare(a.version, b.version));

        if (tags.length > 0) {
            const { gitTag, version } = await pLocate(tags, tag => git.isRefInHistory(tag.gitTag), {
                concurrency: 1,
                preserveOrder: true
            });
            logger.success("Found git tag %s associated with version %s", gitTag, version);

            return { gitHead: await git.tagHead(gitTag), gitTag, version };
        }

        logger.info("No git tag version found");
        return {};
    };
};

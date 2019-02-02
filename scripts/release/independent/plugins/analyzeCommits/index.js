const semver = require("semver");
const { template } = require("lodash");
const { analyzeCommits } = require("@semantic-release/commit-analyzer");
const getCommits = require("./getCommits");
const getLastReleaseFactory = require("./getLastRelease");

/**
 * Plugin factory.
 * @param {Object} pluginConfig
 * @param {Object} pluginConfig.commitAnalyzer (Optional) (https://github.com/semantic-release/commit-analyzer#options)
 * @param {Function} pluginConfig.isRelevant (Optional) A function to determine if the commit is relevant to the package.
 * @returns {function(*, *)}
 */
module.exports = (pluginConfig = {}) => {
    /**
     * Analyze commits for all packages and determine next release version
     */
    return async (params, next) => {
        const { packages, logger, config, git } = params;

        const getLastRelease = getLastReleaseFactory({ logger, git });

        // Fetch all commits and tags
        await git.fetchAll();

        // Detect next version for all packages
        for (let i = 0; i < packages.length; i++) {
            const pkg = packages[i];

            logger.log(`======== Processing %s ========`, pkg.name);
            const lastRelease = await getLastRelease(pkg.tagFormat);
            // Store lastRelease for later use
            packages[i]["lastRelease"] = lastRelease;

            if (!pkg.isIndependent) {
                continue;
            }

            const commits = await getCommits(lastRelease.gitHead, config.branch, logger);
            let relevantCommits = commits;

            if (typeof pluginConfig.isRelevant === "function") {
                relevantCommits = commits.filter(commit => pluginConfig.isRelevant(pkg, commit));
            }

            if (!relevantCommits.length) {
                logger.log(`No relevant commits were found for package %s`, pkg.name);
                logger.log(`======== Finished processing package ========\n\n`);
                continue;
            }

            const type = await analyzeCommits(
                pluginConfig.commitAnalyzer || {},
                Object.assign({ logger, commits: relevantCommits })
            );

            // Store relevant commits for later use
            packages[i].commits = relevantCommits;

            if (!type) {
                logger.log(`No relevant commits indicate a release!`);
                logger.log(`======== Finished processing package ========\n\n`);
                continue;
            }

            relevantCommits.length &&
                logger.log(
                    `Relevant commits:\n${"*".padStart(8)} ${relevantCommits
                        .map(c => c.subject)
                        .join(`\n${"*".padStart(8)} `)}`
                );
            let version;
            if (lastRelease.version) {
                version = semver.inc(lastRelease.version, type);
                logger.log("The next release version is %s", version);
            } else {
                version = "1.0.0";
                logger.log("There is no previous release, the next release version is %s", version);
            }
            packages[i]["nextRelease"] = {
                type,
                version,
                gitHead: await git.head(),
                gitTag: template(pkg.tagFormat)({ version })
            };
            logger.log(`======== Finished processing package ========\n\n`);
        }
        next();
    };
};

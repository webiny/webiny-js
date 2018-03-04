import semver from "semver";
import { template } from "lodash";
import commitAnalyzer from "@semantic-release/commit-analyzer";
import getCommits from "./getCommits";
import getLastReleaseFactory from "./getLastRelease";
import getRelevantCommits from "./relevantCommits";

/**
 * Plugin factory.
 * @param {Object} pluginConfig
 * @param {Object} pluginConfig.analyzeCommits (@https://github.com/semantic-release/commit-analyzer#options)
 * @returns {function(*, *)}
 */
export default (pluginConfig = {}) => {
    /**
     * Analyze commits for all packages and determine next release version
     */
    return async (params, next) => {
        const { packages, logger, config, git } = params;

        const getLastRelease = getLastReleaseFactory({ logger, git });

        // Fetch all commits and tags
        await git.unshallow();

        // Detect next version for all packages
        for (let i = 0; i < packages.length; i++) {
            const pkg = packages[i];
            const tagFormat = config.tagFormat(pkg);

            logger.log(`======== Processing %s ========`, pkg.name);
            const lastRelease = await getLastRelease(tagFormat);
            const commits = await getCommits(lastRelease.gitHead, config.branch, logger);
            const relevantCommits = getRelevantCommits(commits, pkg);

            // Store relevant commits for later use
            packages[i].commits = relevantCommits;

            // Store lastRelease for later use
            packages[i]["lastRelease"] = lastRelease;

            if (!relevantCommits.length) {
                logger.log(`No relevant commits were found for package %s`, pkg.name);
                logger.log(`======== Finished processing package ========\n\n`);
                continue;
            }

            const type = await commitAnalyzer(
                pluginConfig.analyzeCommits || {},
                Object.assign({ logger, commits: relevantCommits })
            );
            relevantCommits.length &&
                logger.log(
                    `Relevant commits:\n* ${relevantCommits.map(c => c.subject).join("\n* ")}`
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
                gitTag: template(tagFormat)({ version })
            };
            logger.log(`======== Finished processing package ========\n\n`);
        }
        next();
    };
};

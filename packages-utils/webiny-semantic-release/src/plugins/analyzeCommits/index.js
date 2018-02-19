import semver from "semver";
import { template } from "lodash";
import commitAnalyzer from "@semantic-release/commit-analyzer";
import getCommits from "./../../utils/getCommits";
import getLastReleaseFactory from "./../../utils/getLastRelease";
import { gitHead } from "./../../utils/git";
import getRelevantCommits from "./relevantCommits";

export default () => {
    /**
     * Analyze commits for all packages and determine next release version
     */
    return async (params, next) => {
        const { packages, logger, config } = params;

        const getLastRelease = getLastReleaseFactory({ logger });

        // Detect next version for all packages
        for (let i = 0; i < packages.length; i++) {
            const pkg = packages[i];
            const tagFormat = config.tagFormat(pkg);

            logger.log(`======== Processing %s ========`, pkg.name);
            // TODO: we could separate last release into a plugin of its own
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
                {},
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
            const nextRelease = {
                type,
                version,
                gitHead: await gitHead(),
                gitTag: template(tagFormat)({ version })
            };
            packages[i]["nextRelease"] = nextRelease;
            logger.log(`======== Finished processing package ========\n\n`);
        }
        next();
    };
};

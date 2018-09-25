const execa = require("execa");
const parseGithubUrl = require("parse-github-url");
const GithubFactory = require("./utils/githubClient");

module.exports = (pluginConfig = {}) => {
    return async ({ lastRelease, nextRelease, config, logger, packages }, next) => {
        let github;

        const githubToken = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
        if (!process.env.GITHUB_AUTH) {
            process.env.GITHUB_AUTH = githubToken;
        }

        if (!config.preview) {
            const githubClientConfig = { ...pluginConfig.githubClient, githubToken };
            github = GithubFactory(githubClientConfig);
        }

        const { name: repo, owner } = parseGithubUrl(config.repositoryUrl);

        const release = {
            owner,
            repo,
            tag_name: nextRelease.gitTag,
            name: nextRelease.gitTag,
            target_commitish: config.branch
        };

        if (config.preview) {
            release.body = await execa.stdout("npx", [
                "lerna-changelog",
                "--from=" + lastRelease.gitTag
            ]);

            logger.log("GitHub release data:\n%s", JSON.stringify(release, null, 2));
        } else {
            logger.log("Publishing a new Github release...");
            try {
                // Create a tag a push it to origin
                await execa("git", ["tag", "-a", nextRelease.gitTag, "-m", nextRelease.gitTag]);
                await execa("git", ["push", "origin", nextRelease.gitTag]);
                // Generate release notes using the new tag
                release.body = await execa.stdout("npx", [
                    "lerna-changelog",
                    "--from=" + lastRelease.gitTag,
                    "--to" + nextRelease.gitTag
                ]);
                const { data } = await github.repos.createRelease(release);
                logger.success("Published Github release: %s", data.html_url);
            } catch (err) {
                logger.error("Failed to publish:\n%s", err.message);
            }
        }
        next();
    };
};

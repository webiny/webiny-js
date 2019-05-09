const parseGithubUrl = require("parse-github-url");
const GithubFactory = require("./utils/githubClient");
const generateChangelog = require("../../../utils/changelog");
const labels = require("../../../utils/labels");

module.exports = (pluginConfig = {}) => {
    return async ({ config, logger, packages }, next) => {
        let github;

        const githubToken = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;

        const githubClientConfig = { ...pluginConfig.githubClient, githubToken };
        github = GithubFactory(githubClientConfig);

        const { name: repo, owner } = parseGithubUrl(config.repositoryUrl);

        let tagger = null;

        // Get current user to construct proper tagger data.
        try {
            const user = await github.users.getAuthenticated({});
            if (user && user.data && user.data.email) {
                tagger = {
                    name: user.data.name,
                    email: user.data.email
                };
            }
        } catch (e) {
            logger.error(e.message);
        }

        for (let i = 0; i < packages.length; i++) {
            const pkg = packages[i];

            const { nextRelease, commits } = pkg;

            if (!nextRelease || !nextRelease.gitTag) {
                continue;
            }

            const release = {
                owner,
                repo,
                tag_name: nextRelease.gitTag,
                name: nextRelease.gitTag,
                body: await generateChangelog({ labels, commits, name: nextRelease.gitTag }),
                target_commitish: config.branch
            };

            if (config.preview) {
                logger.log("GitHub release data:\n%s", JSON.stringify(release, null, 2));
                logger.log("Tagger:\n%s", JSON.stringify(tagger, null, 2));
            } else {
                logger.log("Publishing a new Github release...");
                try {
                    const { data } = await github.repos.createRelease(release);
                    logger.success("Published Github release: %s", data.html_url);
                } catch (err) {
                    logger.error("Failed to publish:\n%s", err.message);
                }
            }
        }

        next();
    };
};

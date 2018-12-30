const parseGithubUrl = require("parse-github-url");
const GithubFactory = require("./utils/githubClient");

module.exports = (pluginConfig = {}) => {
    return async ({ logger, config }, next) => {
        logger.log("Verifying access to Github...");

        const githubToken = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;

        const { name: repo, owner } = parseGithubUrl(config.repositoryUrl);
        if (!owner || !repo) {
            throw Error("Invalid Github URL!");
        }

        if (githubToken) {
            const githubClientConfig = { ...pluginConfig.githubClient, githubToken };
            const github = GithubFactory(githubClientConfig);

            try {
                const { data: { permissions: { push } } } = await github.repos.get({ repo, owner });
                if (!push) {
                    throw Error("You don't have permissions to push!");
                }
            } catch (err) {
                if (err.code === 401) {
                    throw Error("Invalid Github token!");
                } else if (err.code === 404) {
                    throw Error("Repository not found!");
                } else {
                    throw err;
                }
            }
        } else {
            throw Error("No Github token!");
        }

        next();
    };
};

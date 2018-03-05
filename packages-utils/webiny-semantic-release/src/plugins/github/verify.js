import parseGithubUrl from "parse-github-url";
import getError from "./utils/getError";
import GithubFactory from "./utils/githubClient";

export default (pluginConfig = {}) => {
    return async ({ logger, config }, next) => {
        if (config.preview) {
            return next();
        }

        logger.log("Verifying access to Github...");

        const githubToken = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;

        const { name: repo, owner } = parseGithubUrl(config.repositoryUrl);
        if (!owner || !repo) {
            throw getError("EINVALIDGITHUBURL");
        }

        if (githubToken) {
            const githubClientConfig = { ...(pluginConfig.githubClient || {}), githubToken };
            const github = GithubFactory(githubClientConfig);

            try {
                const { data: { permissions: { push } } } = await github.repos.get({ repo, owner });
                if (!push) {
                    throw getError("EGHNOPERMISSION", { owner, repo });
                }
            } catch (err) {
                if (err.code === 401) {
                    throw getError("EINVALIDGHTOKEN", { owner, repo });
                } else if (err.code === 404) {
                    throw getError("EMISSINGREPO", { owner, repo });
                } else {
                    throw err;
                }
            }
        } else {
            throw getError("ENOGHTOKEN", { owner, repo });
        }

        next();
    };
};

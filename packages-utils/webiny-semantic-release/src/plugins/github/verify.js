import parseGithubUrl from "parse-github-url";
import AggregateError from "aggregate-error";
import getError from "./utils/getError";
import GitHubApi from "@octokit/rest";

export default () => {
    return async ({ logger, config }, next) => {
        if (config.dryRun) {
            return next();
        }

        logger.log("Verifying access to Github...");

        const errors = [];
        const githubToken = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;

        const { name: repo, owner } = parseGithubUrl(config.repositoryUrl);
        if (!owner || !repo) {
            errors.push(getError("EINVALIDGITHUBURL"));
        }

        if (githubToken) {
            const github = new GitHubApi();
            github.authenticate({ type: "token", token: githubToken });

            try {
                const { data: { permissions: { push } } } = await github.repos.get({ repo, owner });
                if (!push) {
                    errors.push(getError("EGHNOPERMISSION", { owner, repo }));
                }
            } catch (err) {
                if (err.code === 401) {
                    errors.push(getError("EINVALIDGHTOKEN", { owner, repo }));
                } else if (err.code === 404) {
                    errors.push(getError("EMISSINGREPO", { owner, repo }));
                } else {
                    throw err;
                }
            }
        } else {
            errors.push(getError("ENOGHTOKEN", { owner, repo }));
        }

        if (errors.length > 0) {
            throw new AggregateError(errors);
        }

        next();
    };
};

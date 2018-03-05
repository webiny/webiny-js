import parseGithubUrl from "parse-github-url";
import GithubFactory from "./utils/githubClient";

export default (pluginConfig = {}) => {
    return async ({ config, logger, packages }, next) => {
        const githubToken = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;

        const githubClientConfig = { ...(pluginConfig.githubClient || {}), githubToken };
        const github = GithubFactory(githubClientConfig);

        const { name: repo, owner } = parseGithubUrl(config.repositoryUrl);
        for (let i = 0; i < packages.length; i++) {
            const pkg = packages[i];

            if (!pkg.nextRelease || !pkg.nextRelease.gitTag) {
                continue;
            }

            const release = {
                owner,
                repo,
                tag_name: pkg.nextRelease.gitTag,
                name: pkg.nextRelease.gitTag,
                target_commitish: config.branch,
                body: pkg.nextRelease.notes
            };

            if (config.preview) {
                logger.log(
                    "GitHub release data for %s:\n%s",
                    pkg.name,
                    JSON.stringify(release, null, 2)
                );
            } else {
                try {
                    const { data } = await github.repos.createRelease(release);
                    packages[i].githubRelease = {
                        ...data
                    };
                    logger.log("Published GitHub release: %s", data.html_url);
                } catch (err) {
                    logger.error("Failed to publish %s\n%s", pkg.name, err.message);
                    packages[i].githubRelease = {
                        error: err
                    };
                }
            }
        }
        next();
    };
};

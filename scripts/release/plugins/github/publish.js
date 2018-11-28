const execa = require("execa");
const parseGithubUrl = require("parse-github-url");
const GithubFactory = require("./utils/githubClient");

module.exports = (pluginConfig = {}) => {
    return async ({ lastRelease, nextRelease, config, git, logger, packages }, next, finish) => {
        let github;

        const githubToken = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;

        // Need this variable for lerna-changelog
        process.env.GITHUB_AUTH = githubToken;

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

        let tagger = {};

        // Get current user to construct proper tagger data.
        try {
            const user = await github.users.getAuthenticated({});
            tagger = {
                name: user.data.name,
                email: user.data.email
            };
        } catch (e) {
            logger.error(e.message);
        }

        if (config.preview) {
            release.body = await execa.stdout("npx", [
                "lerna-changelog",
                "--from=" + lastRelease.gitTag
            ]);

            logger.log("GitHub release data:\n%s", JSON.stringify(release, null, 2));
            logger.log("Tagger:\n%s", JSON.stringify(tagger, null, 2));
        } else {
            logger.log("Publishing a new Github release...");
            try {
                // Create a tag
                const {
                    data: { tag, sha }
                } = await github.gitdata.createTag({
                    owner,
                    repo,
                    tag: nextRelease.gitTag,
                    message: nextRelease.gitTag,
                    object: nextRelease.gitHead,
                    type: "commit",
                    tagger
                });
                // Create a reference to the tag so it becomes annotated
                await github.gitdata.createRef({
                    owner,
                    repo,
                    ref: "refs/tags/" + tag,
                    sha
                });

                // Fetch tags from Github to parse PR-s in lerna-changelog including the latest tag
                await execa("git", ["fetch", "--tags"], { reject: false });

                // Generate release notes
                release.body = await execa.stdout("npx", [
                    "lerna-changelog",
                    "--from=" + lastRelease.gitTag,
                    "--to=" + nextRelease.gitTag
                ]);
                const { data } = await github.repos.createRelease(release);
                logger.success("Published Github release: %s", data.html_url);
            } catch (err) {
                logger.error("Failed to publish:\n%s", err.message);
                finish();
                return;
            }
        }
        next();
    };
};

const fetch = require("node-fetch");
const pRetry = require("p-retry");
const semver = require("semver");
const execa = require("execa");
const loadJSON = require("load-json-file");
const writeJSON = require("write-json-file");
const ConventionalCommitUtilities = require("@lerna/conventional-commits");
const { Octokit } = require("@octokit/rest");

class Release {
    tag = undefined;
    version = undefined;
    mostRecentVersion = undefined;
    createGithubRelease = false;

    constructor(logger) {
        if (!logger) {
            throw Error(`Missing required constructor argument "logger"!`);
        }

        this.logger = logger;
    }

    /**
     * NPM dist-tag to publish.
     * @param tag
     */
    setTag(tag) {
        this.tag = tag;
    }

    /**
     * A parameter passed to `lerna version` to generate version.
     * Examples:
     * Latest: --conventional-graduate
     * Beta: --conventional-prerelease --preid beta
     * Unstable: 0.0.0-unstable.b7124ae31d
     * @param version String | String[] | Function
     */
    setVersion(version) {
        this.version = version;
    }

    setCreateGithubRelease(flag) {
        this.createGithubRelease = flag;
    }

    async execute() {
        this.__validateConfig();

        this.logger.info("Attempting to release tag %s", this.tag);

        // Generate `lerna.json` using `example.lerna.json`.
        {
            // Determine current version
            const tags = await this.__getTags();
            this.mostRecentVersion = this.__getMostRecentVersion(
                [tags["latest"], tags[this.tag === "latest" ? "beta" : this.tag]].filter(Boolean)
            );

            this.logger.info("Most recent version is %s", this.mostRecentVersion);
            const lernaJSON = await loadJSON("example.lerna.json");
            lernaJSON.version = this.mostRecentVersion;
            await writeJSON("lerna.json", lernaJSON);
            this.logger.info("Lerna config was written to %s", "lerna.json");
        }

        // Run `lerna` to version packages
        let version = this.version;
        if (typeof this.version === "function") {
            version = await this.version(this.mostRecentVersion);
        }

        if (!Array.isArray(version)) {
            version = [version];
        }

        const lernaVersionArgs = [
            "lerna",
            "version",
            ...version,
            "--force-publish",
            "--no-changelog",
            "--no-git-tag-version",
            "--no-push",
            "--yes"
        ];

        this.logger.debug(lernaVersionArgs.join(" "));
        await execa("yarn", lernaVersionArgs, { stdio: "inherit" });
        this.logger.info("Packages versioning completed");

        // Run `lerna` to publish packages
        const lernaPublishArgs = [
            "lerna",
            "publish",
            "from-package",
            "--dist-tag",
            this.tag,
            "--yes"
        ];

        this.logger.debug(lernaPublishArgs.join(" "));
        await execa("yarn", lernaPublishArgs, { stdio: "inherit" });
        this.logger.info(`Packages were published to NPM under %s dist-tag`, this.tag);

        if (this.createGithubRelease) {
            // Generate changelog, tag commit, and create Github release.
            const lernaJSON = await loadJSON("lerna.json");
            const versionTag = `v${lernaJSON.version}`;

            // Changelog needs to be generated _before_ tagging.
            const changelog = await this.__getChangelog(lernaJSON.version);
            this.logger.info("Generated release notes");

            // Create the tag
            await execa("git", ["tag", versionTag, "-m", versionTag]);
            await execa("git", ["push", "origin", versionTag]);
            this.logger.info("Created Git tag %s", versionTag);

            const { data: release } = await this.__createGithubRelease(versionTag, changelog);
            this.logger.info("Created Github release: %s", release.html_url);
        }

        // Reset all changes made during versioing.
        await execa("git", ["reset", "--hard", "HEAD"]);

        this.logger.success("Release process has finished successfully!");
    }

    __validateConfig() {
        if (this.createGithubRelease && !process.env.GH_TOKEN) {
            throw Error("GH_TOKEN environment variable is not set.");
        }

        if (!this.version) {
            throw Error(
                `Versioning is not configured! Use "setVersion" to configure lerna versioning.`
            );
        }
    }

    async __getTags() {
        const { stdout: npmRegistry } = await execa("npm", ["config", "get", "registry"]);
        this.logger.debug("Using NPM registry at %s", npmRegistry);
        const getVersion = async () => {
            const res = await fetch(`${npmRegistry.replace(/\/$/, "")}/@webiny/cli`);
            const json = await res.json();

            return json["dist-tags"];
        };

        return pRetry(getVersion, { retries: 5 });
    }

    __getMostRecentVersion(versions) {
        return semver.sort(versions).pop().toString();
    }

    async __getChangelog(version) {
        const manifest = {
            name: "root",
            location: process.cwd(),
            manifestLocation: process.cwd() + "/package.json"
        };

        return ConventionalCommitUtilities.updateChangelog(manifest, "root", {
            rootPath: process.cwd(),
            tagPrefix: "v",
            version
        }).then(({ newEntry }) => {
            return newEntry;
        });
    }

    async __createGithubRelease(tag, changelog) {
        const client = new Octokit({
            auth: `token ${process.env.GH_TOKEN}`
        });

        return client.repos.createRelease({
            owner: "webiny",
            repo: "webiny-js",
            tag_name: tag,
            name: tag,
            body: changelog,
            draft: true,
            prerelease: false
        });
    }
}

module.exports = { Release };

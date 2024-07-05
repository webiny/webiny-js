const fetch = require("node-fetch");
const pRetry = require("p-retry");
const semver = require("semver");
const execa = require("execa");
const loadJSON = require("load-json-file");
const writeJSON = require("write-json-file");
const { Octokit } = require("@octokit/rest");
const { Changelog } = require("./Changelog");

class Release {
    tag = undefined;
    version = undefined;
    resetAllChanges = true;
    mostRecentVersion = undefined;
    createGithubRelease = false;
    npmTags = [];

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

    /**
     * @param {boolean|string} flag Boolean or "latest" to mark release as "latest" on Github
     */
    setCreateGithubRelease(flag) {
        this.createGithubRelease = flag;
    }

    setResetAllChanges(reset) {
        this.resetAllChanges = reset;
    }

    async versionPackages() {
        this.__validateConfig();

        this.logger.info("Attempting to release tag %s", this.tag);

        // Generate `lerna.json` using `example.lerna.json`.
        {
            // Determine current version
            this.npmTags = await this.__getTags();
            this.mostRecentVersion = this.__getMostRecentVersion(
                [
                    this.npmTags["latest"],
                    this.npmTags[this.tag === "latest" ? "beta" : this.tag]
                ].filter(Boolean)
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

        // Read the new version
        const lernaJSON = await loadJSON("lerna.json");
        return { version: lernaJSON.version, tag: this.tag };
    }

    async execute() {
        await this.versionPackages();

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

        if (this.createGithubRelease !== false) {
            // Generate changelog, tag commit, and create Github release.
            const lernaJSON = await loadJSON("lerna.json");
            const versionTag = `v${lernaJSON.version}`;

            // Create the tag
            await execa("git", ["tag", versionTag, "-m", versionTag]);
            await execa("git", ["push", "origin", versionTag]);
            this.logger.info("Created Git tag %s", versionTag);

            // Changelog and Github release.
            try {
                const changelog = await this.__getChangelog(lernaJSON.version);
                this.logger.log("Changelog:\n\n%s\n\n", changelog);

                const { data: release } = await this.__createGithubRelease(versionTag, changelog);
                this.logger.info("Created Github release: %s", release.html_url);
            } catch (err) {
                this.logger.warning("Failed to create a Github release: %s", err.message);
                this.logger.log(err);
            }
        }

        // Reset all changes made during versioning.
        if (this.resetAllChanges) {
            await execa("git", ["reset", "--hard", "HEAD"]);
        }

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

    async __getChangelog(currentlyPublishedVersion) {
        const from = `v${this.npmTags["latest"]}`;
        const to = `v${currentlyPublishedVersion}`;

        this.logger.info(`Generating changelog ${from}..${to}`);
        return new Changelog(process.cwd()).generate(from, to);
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
            prerelease: false,
            // `make_latest` is of type `string`
            make_latest: this.createGithubRelease === "latest" ? "true" : "false"
        });
    }
}

module.exports = { Release };

import execa from "execa";
import { Octokit } from "@octokit/rest";
import { Changelog } from "./Changelog";
import { GithubRelease } from "./GithubRelease";
import { versionPackages } from "./versionPackages";
import { publishPackages } from "./publishPackages";
import { fetchNpmDistTags } from "./fetchNpmVersion";

export class Release {
    distTag: string | undefined = undefined;
    version: string | undefined = undefined;
    preid: string | undefined = undefined;
    resetAllChanges = true;
    dryRun = false;
    createGithubRelease: GithubRelease = GithubRelease.from(false);
    logger: any;

    constructor(logger: any) {
        if (!logger) {
            throw Error(`Missing required constructor argument "logger"!`);
        }

        this.logger = logger;
    }

    setTag(tag: string) {
        this.distTag = tag;
    }

    setVersion(version: string) {
        this.version = version;
    }

    setPreid(preid: string) {
        this.preid = preid;
    }

    setCreateGithubRelease(flag: unknown) {
        this.createGithubRelease = GithubRelease.from(flag);
    }

    setResetAllChanges(reset: boolean) {
        this.resetAllChanges = reset;
    }

    setDryRun(dryRun: boolean) {
        this.dryRun = dryRun;
    }

    async computeVersion(): Promise<string> {
        if (!this.version) {
            throw Error(`"--version" is required for this release type.`);
        }
        return this.version;
    }

    async execute() {
        this.validateConfig();

        const version = await this.computeVersion();
        this.logger.info("Computed version: %s", version);
        this.logger.info("Dist-tag: %s", this.distTag);

        // Run root prepublishOnly.
        this.logger.info("Running prepublishOnly...");
        await execa("yarn", ["prepublishOnly"], { stdio: "inherit" });

        // Rewrite versions in dist/package.json files.
        this.logger.info("Rewriting package versions to %s", version);
        const versionedPackages = versionPackages(version);
        this.logger.info("Versioned %s packages", versionedPackages.length);

        // Fetch the current latest version BEFORE publishing, so the changelog
        // can diff against the previous release (not the one we're about to push).
        let previousLatest: string | undefined;
        try {
            const distTags = await this.fetchDistTags();
            previousLatest = distTags["latest"];
        } catch (err: any) {
            this.logger.warning("Could not fetch dist-tags: %s", err.message);
        }

        if (this.dryRun) {
            this.logger.info("Dry run — skipping publish, GitHub release, and git reset.");

            try {
                const fromRef = previousLatest ? `v${previousLatest}` : "HEAD~10";
                const changelog = await new Changelog(process.cwd()).generate(fromRef, "HEAD");
                this.logger.log("Changelog preview:\n\n%s\n", changelog);
            } catch (err: any) {
                this.logger.warning("Could not generate changelog preview: %s", err.message);
            }

            return { version, tag: this.distTag };
        }

        // Publish all packages.
        const results = await publishPackages({
            distTag: this.distTag!,
            logger: this.logger
        });

        const failures = results.filter(r => !r.success);
        if (failures.length > 0) {
            throw Error(`Failed to publish ${failures.length} package(s). See logs above.`);
        }

        this.logger.info(
            "Packages were published to NPM under %s dist-tag, with version %s",
            this.distTag,
            version
        );

        if (this.createGithubRelease.isEnabled()) {
            await this.createRelease(version, previousLatest);
        }

        if (this.resetAllChanges) {
            await execa("git", ["reset", "--hard", "HEAD"]);
        }

        this.logger.success("Release process has finished successfully!");
        return { version, tag: this.distTag };
    }

    async printVersion() {
        const version = await this.computeVersion();
        console.log(version);
    }

    protected validateConfig() {
        if (!this.dryRun && this.createGithubRelease.isEnabled() && !process.env.GH_TOKEN) {
            throw Error("GH_TOKEN environment variable is not set.");
        }

        if (!this.distTag) {
            throw Error("Dist-tag is not configured. Use setTag() to configure.");
        }
    }

    protected async fetchDistTags(): Promise<Record<string, string>> {
        return fetchNpmDistTags();
    }

    private async createRelease(version: string, previousLatest: string | undefined) {
        const versionTag = `v${version}`;

        await execa("git", ["tag", versionTag, "-m", versionTag]);
        await execa("git", ["push", "origin", versionTag]);
        this.logger.info("Created Git tag %s", versionTag);

        try {
            const fromRef = previousLatest ? `v${previousLatest}` : versionTag;

            const changelog = await new Changelog(process.cwd()).generate(fromRef, versionTag);
            this.logger.log("Changelog:\n\n%s\n\n", changelog);

            const client = new Octokit({
                auth: process.env.GH_TOKEN
            });

            const { data: release } = await client.repos.createRelease({
                owner: "webiny",
                repo: "webiny-js",
                tag_name: versionTag,
                name: versionTag,
                body: changelog,
                prerelease: false,
                make_latest: this.createGithubRelease.isLatest() ? "true" : "false"
            });

            this.logger.info("Created Github release: %s", release.html_url);
        } catch (err: any) {
            this.logger.warning("Failed to create a Github release: %s", err.message);
            this.logger.log(err);
        }
    }
}

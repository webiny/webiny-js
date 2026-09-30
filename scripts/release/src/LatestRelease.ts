import semver from "semver";
import { Release } from "./Release.js";

export class LatestRelease extends Release {
    defaultTag = "latest";

    // Set when this release is a patch for an older line, so the changelog diffs against that
    // line's previous release instead of whatever `latest` points at.
    private previousRelease: string | undefined = undefined;

    constructor(logger: any) {
        super(logger);
        this.setTag(this.defaultTag);
        this.setCreateGithubRelease("latest");
    }

    override setTag(tag: string) {
        if (tag !== this.defaultTag) {
            this.logger.warning(
                "Latest release can only be published using the %s tag; the requested %s tag will be ignored.",
                this.defaultTag,
                tag
            );

            return;
        }

        super.setTag(tag);
    }

    override async computeVersion(): Promise<string> {
        if (!this.version) {
            throw Error(`"--version" is required for latest releases.`);
        }

        // No try/catch on purpose: without the current `latest` there's no telling whether this
        // release would move it backwards, so the release stops instead of guessing.
        const distTags = await this.fetchDistTags();

        // `latest` must stay on the newest version. A patch for an older line (6.4.13 after 6.5.0
        // is out) goes under that line's own tag instead, so `@latest-6.4` still gets the newest
        // 6.4 patch, and it isn't marked as the latest GitHub release either.
        const currentLatest = distTags[this.defaultTag];
        if (currentLatest && semver.lt(this.version, currentLatest)) {
            const line = `${semver.major(this.version)}.${semver.minor(this.version)}`;
            super.setTag(`${this.defaultTag}-${line}`);

            if (this.createGithubRelease.isLatest()) {
                this.setCreateGithubRelease(true);
            }

            // Only an older-line patch needs the version list, so a regular release doesn't
            // depend on it.
            const publishedVersions = await this.fetchPublishedVersions();
            this.previousRelease =
                semver.maxSatisfying(publishedVersions, `>=${line}.0 <${this.version}`) ??
                undefined;
        }

        return this.version;
    }

    protected override async findPreviousRelease(): Promise<string | undefined> {
        return this.previousRelease ?? super.findPreviousRelease();
    }
}

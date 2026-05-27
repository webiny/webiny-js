import { Release } from "./Release";

export class LatestRelease extends Release {
    defaultTag = "latest";

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
        return this.version;
    }
}

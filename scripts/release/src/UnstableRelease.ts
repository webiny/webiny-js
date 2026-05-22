import execa from "execa";
import { Release } from "./Release";

export class UnstableRelease extends Release {
    protectedTags: string[] = ["latest", "beta"];

    constructor(logger: any) {
        super(logger);
        this.setTag("unstable");
        this.setCreateGithubRelease(false);
    }

    override setTag(tag: string) {
        if (this.protectedTags.includes(tag)) {
            throw Error(`Protected tag "${tag}" can't be used in an unstable release!`);
        }

        super.setTag(tag);
    }

    override setVersion(version: string) {
        throw Error(`"--version" is not allowed for unstable releases.`);
    }

    override async computeVersion(): Promise<string> {
        const { stdout: commitHash } = await execa("git", ["rev-parse", "--short", "HEAD"]);
        return `0.0.0-${this.distTag}.${commitHash}`;
    }
}

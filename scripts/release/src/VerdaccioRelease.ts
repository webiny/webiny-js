import execa from "execa";
import { Release } from "./Release";

export class VerdaccioRelease extends Release {
    constructor(logger: any) {
        super(logger);
        this.setTag("local-npm");
        this.setCreateGithubRelease(false);
    }

    override setVersion(version: string) {
        throw Error(`"--version" is not allowed for verdaccio releases.`);
    }

    override async computeVersion(): Promise<string> {
        const { stdout: commitHash } = await execa("git", ["rev-parse", "--short", "HEAD"]);
        return `0.0.0-${this.distTag}.${commitHash}`;
    }
}

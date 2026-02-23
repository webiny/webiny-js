import { Release } from "./Release";

export class BetaRelease extends Release {
    constructor(logger: any) {
        super(logger);

        const VERSION = process.env.BETA_VERSION || "--conventional-prerelease";

        this.setTag("beta");
        this.setVersion([VERSION, "--preid", "beta"]);
        this.setCreateGithubRelease(false);
    }

    override setTag(tag: string) {
        super.setTag(tag);
    }
}

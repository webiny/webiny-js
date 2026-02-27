import { Release } from "./Release";

const VERSION = process.env.BETA_VERSION || "--conventional-prerelease";

export class BetaRelease extends Release {
    constructor(logger: any) {
        super(logger);

        this.setTag("beta");
        this.setVersion([VERSION, "--preid", "beta"]);
        this.setCreateGithubRelease(false);
    }

    override setTag(tag: string) {
        super.setTag(tag);
        this.setVersion([VERSION, "--preid", tag]);
    }
}

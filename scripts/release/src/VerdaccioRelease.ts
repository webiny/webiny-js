import { Release } from "./Release";

export class VerdaccioRelease extends Release {
    defaultTag = "local-npm";

    constructor(logger: any) {
        super(logger);
        this.setTag(this.defaultTag);
        this.setVersion(() => {
            return ["--conventional-prerelease", "--preid", this.distTag!];
        });
        this.setCreateGithubRelease(false);
    }
}

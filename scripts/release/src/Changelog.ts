// @ts-expect-error No types available.
import conventionalChangelogCore from "conventional-changelog-core";
// @ts-expect-error No types available.
import angularPreset from "conventional-changelog-angular";

export class Changelog {
    cwd: string;
    preset: any;

    constructor(cwd: string, preset: any = angularPreset) {
        this.cwd = cwd;
        this.preset = preset;
    }

    async generate(fromRef: string, toRef: string) {
        let changelog = "";

        for await (let chunk of conventionalChangelogCore(
            {
                currentTag: toRef,
                previousTag: fromRef,
                cwd: this.cwd,
                config: this.preset
            },
            // Writer options
            { currentTag: toRef, previousTag: fromRef, version: toRef },
            // `git-raw-commits` options
            { from: fromRef, to: toRef }
        )) {
            const log = chunk.toString();
            if (log.includes("* ")) {
                changelog += chunk.toString();
            }
        }

        return changelog;
    }
}

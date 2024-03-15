const conventionalChangelogCore = require("conventional-changelog-core");
const angularPreset = require("conventional-changelog-angular");

class Changelog {
    constructor(cwd, preset = angularPreset) {
        this.cwd = cwd;
        this.preset = preset;
    }

    async generate(fromRef, toRef) {
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

module.exports.Changelog = Changelog;

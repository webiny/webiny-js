import { ZeroBuildsRunner } from "./ZeroBuildsRunner.js";
import { SingleBuildRunner } from "./SingleBuildRunner.js";
import { MultipleBuildsRunner } from "./MultipleBuildsRunner.js";
import { BaseBuildRunner } from "./BaseBuildRunner.js";

export class BuildRunner extends BaseBuildRunner {
    public override run() {
        const RunnerClass = this.getRunnerClass();

        const runner = new RunnerClass({
            packagesBuilder: this.packagesBuilder,
            stdio: this.stdio,
            ui: this.ui
        });

        return runner.run();
    }

    isEmpty() {
        return this.packagesBuilder.getPackages().length === 0;
    }

    private getRunnerClass() {
        const packagesCount = this.packagesBuilder.getPackages().length;
        if (packagesCount === 0) {
            return ZeroBuildsRunner;
        }

        if (packagesCount === 1) {
            return SingleBuildRunner;
        }

        return MultipleBuildsRunner;
    }
}

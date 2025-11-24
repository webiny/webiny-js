import { BaseBuildRunner } from "./BaseBuildRunner.js";
import { measureDuration } from "~/features/utils/index.js";

export class MultipleBuildsRunner extends BaseBuildRunner {
    public override async run() {
        const getBuildDuration = measureDuration();
        const ui = this.ui;

        const builder = this.packagesBuilder;
        const buildProcesses = builder.prepare();

        buildProcesses.setForkOptions({
            stdio: "inherit",
            env: process.env
        });

        ui.info(`Building %s packages... `, buildProcesses.length);
        ui.newLine();

        await buildProcesses.run({
            beforeBuild: buildProcess => {
                ui.info(`Building package: %s`, buildProcess.getPackage().name);
                ui.newLine();
            }
        });

        ui.success(`Built ${buildProcesses.length} packages in ${getBuildDuration()}.`);
    }
}

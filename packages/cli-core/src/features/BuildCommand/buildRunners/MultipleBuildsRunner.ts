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

        const onBeforeBuildCallbacks = builder.getOnBeforeBuildCallbacks();
        for (const onBeforeBuildCallback of onBeforeBuildCallbacks) {
            await onBeforeBuildCallback(builder.getBuildParams());
        }

        await buildProcesses.run();

        const onAfterBuildCallbacks = builder.getOnAfterBuildCallbacks();
        for (const onAfterBuildCallback of onAfterBuildCallbacks) {
            await onAfterBuildCallback(builder.getBuildParams());
        }

        ui.success(`Built ${buildProcesses.length} packages in ${getBuildDuration()}.`);
    }
}

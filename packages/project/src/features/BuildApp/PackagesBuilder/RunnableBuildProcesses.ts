import { type RunnableBuildProcess } from "./RunnableBuildProcess.js";
import { type ForkOptions } from "child_process";
import { type PackagesBuilder } from "./PackagesBuilder.js";
import { type IRunnableBuildProcesses, IRunOptions } from "~/abstractions/models/index.js";

export class RunnableBuildProcesses implements IRunnableBuildProcesses {
    builder: PackagesBuilder;
    runnableBuildProcesses: RunnableBuildProcess[];

    constructor(builder: PackagesBuilder, runnableBuildProcesses: RunnableBuildProcess[]) {
        this.builder = builder;
        this.runnableBuildProcesses = runnableBuildProcesses;
    }

    async run(options?: IRunOptions) {
        const buildParams = this.builder.getBuildParams();

        const onBeforeBuildCallbacks = this.builder.getOnBeforeBuildCallbacks();
        for (const onBeforeBuildCallback of onBeforeBuildCallbacks) {
            await onBeforeBuildCallback(buildParams);
        }

        for (const runnableBuildProcess of this.runnableBuildProcesses) {
            if (options?.beforeBuild) {
                await options.beforeBuild(runnableBuildProcess);
            }
            await runnableBuildProcess.run();
            if (options?.afterBuild) {
                await options.afterBuild(runnableBuildProcess);
            }
        }

        const onAfterBuildCallbacks = this.builder.getOnAfterBuildCallbacks();
        for (const onAfterBuildCallback of onAfterBuildCallbacks) {
            await onAfterBuildCallback(buildParams);
        }
    }

    setForkOptions(options: ForkOptions) {
        this.runnableBuildProcesses.forEach(runnableBuildProcess => {
            runnableBuildProcess.setForkOptions(options);
        });

        return this;
    }

    getBuilder() {
        return this.builder;
    }

    getProcesses() {
        return this.runnableBuildProcesses;
    }

    map<TReturn>(cb: (process: RunnableBuildProcess) => TReturn) {
        return this.runnableBuildProcesses.map(cb);
    }

    forEach(cb: (process: RunnableBuildProcess) => void) {
        return this.runnableBuildProcesses.forEach(cb);
    }

    get length() {
        return this.runnableBuildProcesses.length;
    }
}

import { type ForkOptions } from "child_process";
import { type IRunnableBuildProcess } from "./IRunnableBuildProcess.js";
import { type IPackagesBuilder } from "./IPackagesBuilder.js";

export interface IRunOptions {
    beforeBuild?: (process: IRunnableBuildProcess) => void | Promise<void>;
    afterBuild?: (process: IRunnableBuildProcess) => void | Promise<void>;
}

export interface IRunnableBuildProcesses {
    run(options?: IRunOptions): Promise<void>;

    setForkOptions(options: ForkOptions): this;

    getBuilder(): IPackagesBuilder;

    getProcesses(): IRunnableBuildProcess[];

    map<TReturn>(cb: (process: IRunnableBuildProcess) => TReturn): TReturn[];

    forEach(cb: (process: IRunnableBuildProcess) => void): void;

    get length(): number;
}

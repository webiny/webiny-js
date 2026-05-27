import { fork, type ForkOptions } from "child_process";
import path from "path";
import {
    type IPackagesBuilder,
    type IRunnableBuildProcess,
    type IBasePackagesBuilderPackage
} from "~/abstractions/models/index.js";

export interface RunnableProcessParams {
    builder: IPackagesBuilder;
    pkg: IBasePackagesBuilderPackage;
    forkOptions?: ForkOptions;
}

export class RunnableBuildProcess implements IRunnableBuildProcess {
    builder: IPackagesBuilder;
    pkg: IBasePackagesBuilderPackage;
    forkOptions: ForkOptions | undefined;

    constructor(params: RunnableProcessParams) {
        this.builder = params.builder;
        this.pkg = params.pkg;
        this.forkOptions = params.forkOptions || {
            env: {
                ...process.env,
                ...(params.builder.getBuildParams().analyze ? { RSDOCTOR: "true" } : {})
            },
            stdio: ["pipe", "pipe", "pipe", "ipc"]
        };
    }

    run() {
        const workerPath = path.resolve(import.meta.dirname, "worker.js");

        const buildParams = this.builder.getBuildParams();
        const buildProcess = fork(
            workerPath,
            [JSON.stringify({ ...buildParams, package: this.pkg })],
            this.forkOptions
        );

        return new Promise<void>((resolve, reject) => {
            buildProcess.on("message", (message: Record<string, any>) => {
                if (message.error) {
                    return reject(
                        new Error(
                            message.error.message || "Unknown error occurred in build process"
                        )
                    );
                }

                return resolve();
            });
        });
    }

    setForkOptions(options: ForkOptions) {
        this.forkOptions = options;
    }

    getPackage() {
        return this.pkg;
    }
}

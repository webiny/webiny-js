import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type GetApp } from "~/abstractions/index.js";
import { type WebinyConfigWatcher } from "~/features/Watch/watchers/WebinyConfigWatcher.js";
import { type PackagesWatcher } from "~/features/Watch/watchers/PackagesWatcher.js";
import {
    type ServersWatcher,
    type RunnableServerProcess
} from "~/features/Watch/watchers/ServersWatcher.js";

export interface IWatchNoAppParams {
    package?: string | string[];
    function?: string | string[];
}

export interface IWatchWithAppParams extends IWatchNoAppParams {
    app: GetApp.AppName;
    allowProduction?: boolean;
    deploymentChecks?: boolean;

    // Local AWS Lambda development (https://webiny.link/local-aws-lambda-development)
    inspect?: boolean;
    increaseTimeout?: number;
    increaseHandshakeTimeout?: number;
}

export type IWatchParams = IWatchNoAppParams | IWatchWithAppParams;

export type IWatchResult = {
    packagesWatcher: PackagesWatcher;
    webinyConfigWatcher?: WebinyConfigWatcher;
    /**
     * Long-running server process(es) the hosting type attached to this watch session (e.g. the api HTTP
     * server). The serve-side counterpart to `packagesWatcher`; the caller (e.g. the CLI) renders +
     * awaits them alongside the build watchers.
     */
    serversWatcher?: ServersWatcher;
};

export interface IWatch {
    execute(params: IWatchParams): Promise<IWatchResult>;
}

export const Watch = createAbstraction<IWatch>("Watch");

export namespace Watch {
    export type Interface = IWatch;

    export type WatchNoAppParams = IWatchNoAppParams;
    export type WatchWithAppParams = IWatchWithAppParams;
    export type Params = IWatchParams;
    export type Result = IWatchResult;
    export type Process = RunnableServerProcess;

    /** The prepared (not yet running) build processes of a `packagesWatcher`. */
    export type BuildProcesses = ReturnType<PackagesWatcher["prepare"]>;
}

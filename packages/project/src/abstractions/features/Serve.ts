import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type GetApp } from "~/abstractions/index.js";
import {
    type ServersWatcher,
    type RunnableServerProcess
} from "~/features/Watch/watchers/ServersWatcher.js";

export interface IServeParams {
    /**
     * App to serve. Omit to serve all servable apps at once. Which apps are servable (and how) is
     * hosting-specific — the base hosting type supports none.
     */
    app?: GetApp.AppName;
}

export interface IServeResult {
    /**
     * The server process(es) to serve, wrapped like the watch command's `packagesWatcher`. The caller
     * (e.g. the CLI) prepares + runs them, owning terminal rendering + lifecycle. Implementations
     * assume the apps are already built.
     */
    serversWatcher: ServersWatcher;
}

export interface IServe {
    execute(params: IServeParams): Promise<IServeResult>;
}

export const Serve = createAbstraction<IServe>("Serve");

export namespace Serve {
    export type Interface = IServe;
    export type Params = IServeParams;
    export type Result = IServeResult;
    export type Process = RunnableServerProcess;
}

import { type ChildProcess } from "node:child_process";
import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type GetApp } from "~/abstractions/index.js";

export interface IServeParams {
    /**
     * App to serve. Omit to serve all servable apps at once. Which apps are servable (and how) is
     * flavour-specific — the base flavour supports none.
     */
    app?: GetApp.AppName;
}

/**
 * A running server process. The project layer creates it (port resolution, runner, env); the CLI
 * owns its terminal rendering (prefixing, piping) and lifecycle (awaiting exit) — mirroring how the
 * watch command consumes PackagesWatcher processes.
 */
export interface IServeProcess {
    name: string;
    child: ChildProcess;
}

export interface IServeResult {
    processes: IServeProcess[];
}

export interface IServe {
    /**
     * Spawn the server process(es) for one or all built apps (production) and return them for the CLI
     * to render + await. Implementations assume the apps are already built.
     */
    execute(params: IServeParams): Promise<IServeResult>;
}

export const Serve = createAbstraction<IServe>("Serve");

export namespace Serve {
    export type Interface = IServe;
    export type Params = IServeParams;
    export type Result = IServeResult;
    export type Process = IServeProcess;
}

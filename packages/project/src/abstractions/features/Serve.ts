import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type GetApp } from "~/abstractions/index.js";

export interface IServeParams {
    /**
     * App to serve. Omit to serve all servable apps at once. Which apps are servable (and how) is
     * flavour-specific — the base flavour supports none.
     */
    app?: GetApp.AppName;
}

export interface IServe {
    /**
     * Serve one or all built apps as long-running servers (production). Blocks until the server(s)
     * exit. Implementations assume the apps are already built.
     */
    execute(params: IServeParams): Promise<void>;
}

export const Serve = createAbstraction<IServe>("Serve");

export namespace Serve {
    export type Interface = IServe;
    export type Params = IServeParams;
}

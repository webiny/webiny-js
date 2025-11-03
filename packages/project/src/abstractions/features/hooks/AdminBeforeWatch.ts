import { Abstraction } from "@webiny/di";
import { type Watch } from "~/abstractions/index.js";

export interface IAdminBeforeWatch {
    execute(params: Watch.WatchWithAppParams): void | Promise<void>;
}

export const AdminBeforeWatch = new Abstraction<IAdminBeforeWatch>("AdminBeforeWatch");

export namespace AdminBeforeWatch {
    export type Interface = IAdminBeforeWatch;
    export type Params = Watch.WatchWithAppParams;
}

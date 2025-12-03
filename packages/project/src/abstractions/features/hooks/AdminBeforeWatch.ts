import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type Watch } from "~/abstractions/index.js";

export interface IAdminBeforeWatch {
    execute(params: Watch.WatchWithAppParams): void | Promise<void>;
}

export const AdminBeforeWatch = createAbstraction<IAdminBeforeWatch>("AdminBeforeWatch");

export namespace AdminBeforeWatch {
    export type Interface = IAdminBeforeWatch;
    export type Params = Watch.WatchWithAppParams;
}

import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { Watch } from "~/abstractions/index.js";

export interface ICoreBeforeWatch {
    execute(params: Watch.WatchWithAppParams): void | Promise<void>;
}

export const CoreBeforeWatch = createAbstraction<ICoreBeforeWatch>("CoreBeforeWatch");

export namespace CoreBeforeWatch {
    export type Interface = ICoreBeforeWatch;
    export type Params = Watch.WatchWithAppParams;
}

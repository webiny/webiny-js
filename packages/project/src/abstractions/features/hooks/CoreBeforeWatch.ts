import { Abstraction } from "@webiny/di";
import { Watch } from "~/abstractions/index.js";

export interface ICoreBeforeWatch {
    execute(params: Watch.WatchWithAppParams): void | Promise<void>;
}

export const CoreBeforeWatch = new Abstraction<ICoreBeforeWatch>("CoreBeforeWatch");

export namespace CoreBeforeWatch {
    export type Interface = ICoreBeforeWatch;
    export type Params = Watch.WatchWithAppParams;
}

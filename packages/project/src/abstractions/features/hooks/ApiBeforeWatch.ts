import { Abstraction } from "@webiny/di";
import { type Watch } from "~/abstractions/index.js";

export interface IApiBeforeWatch {
    execute(params: Watch.WatchWithAppParams): void | Promise<void>;
}

export const ApiBeforeWatch = new Abstraction<IApiBeforeWatch>("ApiBeforeWatch");

export namespace ApiBeforeWatch {
    export type Interface = IApiBeforeWatch;
    export type Params = Watch.WatchWithAppParams;
}

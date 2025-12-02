import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type Watch } from "~/abstractions/index.js";

export interface IBeforeWatch {
    execute(params: Watch.Params): void | Promise<void>;
}

export const BeforeWatch = createAbstraction<IBeforeWatch>("BeforeWatch");

export namespace BeforeWatch {
    export type Interface = IBeforeWatch;
    export type Params = Watch.Params;
}

import { createAbstraction } from "@webiny/feature/admin";
import type { PlaygroundClient } from "./PlaygroundClient.js";

export interface IPlaygroundClientFactoryOptions {
    getToken?: PlaygroundClient.TokenGetter;
}

export interface IPlaygroundClientFactory {
    createClient(
        endpoint: string,
        options?: IPlaygroundClientFactoryOptions
    ): PlaygroundClient.Interface;
}

export const PlaygroundClientFactory =
    createAbstraction<IPlaygroundClientFactory>("PlaygroundClientFactory");

export namespace PlaygroundClientFactory {
    export type Interface = IPlaygroundClientFactory;
    export type Options = IPlaygroundClientFactoryOptions;
}

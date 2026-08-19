import { createAbstraction } from "@webiny/feature/admin";
import type { PlaygroundClient } from "./PlaygroundClient.js";

export interface IAuthenticatedPlaygroundClientFactoryOptions {
    getToken?: PlaygroundClient.TokenGetter;
    getTenant?: () => string | null;
}

export interface IAuthenticatedPlaygroundClientFactory {
    createClient(
        endpoint: string,
        options?: IAuthenticatedPlaygroundClientFactoryOptions
    ): PlaygroundClient.Interface;
}

export const AuthenticatedPlaygroundClientFactory =
    createAbstraction<IAuthenticatedPlaygroundClientFactory>(
        "AuthenticatedPlaygroundClientFactory"
    );

export namespace AuthenticatedPlaygroundClientFactory {
    export type Interface = IAuthenticatedPlaygroundClientFactory;
    export type Options = IAuthenticatedPlaygroundClientFactoryOptions;
    export type Client = PlaygroundClient.Interface;
}

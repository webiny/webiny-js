import { createAbstraction } from "@webiny/feature/admin";
import type { PlaygroundClient } from "./abstractions.js";

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
}

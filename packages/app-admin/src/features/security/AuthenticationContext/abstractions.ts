import { createAbstraction } from "@webiny/feature/admin";

type IIdToken = string;

type IIdTokenProvider = () => Promise<IIdToken | undefined> | IIdToken | undefined;

type ILogoutCallback = () => Promise<void> | void;

export interface IAuthenticationContext {
    clear(): void;
    getIdToken: IIdTokenProvider;
    setIdTokenProvider(provider: IIdTokenProvider): void;
    setLogoutCallback(callback: ILogoutCallback): void;
    getLogoutCallback(): ILogoutCallback;
}

export const AuthenticationContext =
    createAbstraction<IAuthenticationContext>("AuthenticationContext");

export namespace AuthenticationContext {
    export type Interface = IAuthenticationContext;
    export type IdTokenProvider = IIdTokenProvider;
    export type LogoutCallback = ILogoutCallback;
}

export interface IInternalTokenProvider {
    setTokenProvider(idTokenProvider: IIdTokenProvider): void;
    getTokenProvider(): IIdTokenProvider;
}

export const InternalIdTokenProvider =
    createAbstraction<IInternalTokenProvider>("InternalTokenProvider");
export namespace InternalIdTokenProvider {
    export type Interface = IInternalTokenProvider;
    export type TokenProvider = IIdTokenProvider;
}

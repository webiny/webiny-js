import { createAbstraction } from "@webiny/feature/admin";

type IIdToken = string;

type IIdTokenProvider = () => Promise<IIdToken | undefined> | IIdToken | undefined;

type ILogoutCallback = () => void;

export interface IAuthenticationContext {
    getIdToken: IIdTokenProvider;
    setIdTokenProvider(provider: IIdTokenProvider): void;
    getLogoutCallback(): ILogoutCallback;
    setLogoutCallback(callback: ILogoutCallback | undefined): void;
}

export const AuthenticationContext =
    createAbstraction<IAuthenticationContext>("AuthenticationContext");

export namespace AuthenticationContext {
    export type Interface = IAuthenticationContext;
    export type IdTokenProvider = IIdTokenProvider;
    export type IdToken = IIdToken;
    export type LogoutCallback = ILogoutCallback;
}

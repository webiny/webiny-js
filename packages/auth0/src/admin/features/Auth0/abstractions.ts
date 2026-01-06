import { Auth0Client } from "@auth0/auth0-spa-js";
import { createAbstraction } from "@webiny/feature/admin";

export type IOnLogin = (auth0: Auth0Client) => void;

export interface IAuth0Presenter {
    vm: {
        isAuthenticated: boolean;
        isLoggingIn: boolean;
        checkingSession: boolean;
    };
    init(params: IAuth0InitParams): Promise<void>;
    authenticate(): void;
}

export interface IAuth0InitParams {
    issuer: string;
    clientId: string;
    autoLogin: boolean;
}

export const Auth0Presenter = createAbstraction<IAuth0Presenter>("Auth0Presenter");

export namespace Auth0Presenter {
    export type Interface = IAuth0Presenter;
    export type InitParams = IAuth0InitParams;
    export type OnLogin = IOnLogin;
}

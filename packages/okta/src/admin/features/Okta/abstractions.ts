import { OktaAuth } from "@okta/okta-auth-js";
import { createAbstraction } from "@webiny/feature/admin";

export type IOnLogin = (oktaAuth: OktaAuth) => void;

export interface IOktaPresenter {
    vm: {
        isAuthenticated: boolean;
        isLoggingIn: boolean;
        checkingSession: boolean;
    };
    init(params: IOktaInitParams): Promise<void>;
    authenticate(): void;
}

export interface IOktaInitParams {
    issuer: string;
    clientId: string;
    autoLogin: boolean;
}

export const OktaPresenter = createAbstraction<IOktaPresenter>("OktaPresenter");

export namespace OktaPresenter {
    export type Interface = IOktaPresenter;
    export type InitParams = IOktaInitParams;
    export type OnLogin = IOnLogin;
}

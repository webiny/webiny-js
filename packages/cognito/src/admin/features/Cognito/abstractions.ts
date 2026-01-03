import { createAbstraction } from "@webiny/feature/admin";

export type AuthState =
    | "signIn"
    | "signedIn"
    | "signedOut"
    | "signedUp"
    | "verifyContact"
    | "confirmSignIn"
    | "requireNewPassword"
    | "setNewPassword"
    | "TOTPSetup"
    | "confirmSignUp"
    | "forgotPassword";

export interface AuthDataVerified {
    email?: string;
    phone_number?: string;
}

export interface AuthDataUnverified {
    email?: string;
    phone_number?: string;
}

export interface AuthData {
    username?: string;
    verified?: AuthDataVerified;
    unverified?: AuthDataUnverified;
    [key: string]: string | null | boolean | undefined | AuthDataVerified | AuthDataUnverified;
}

export interface AuthMessage {
    title: string;
    text: string;
    type: "success" | "info" | "warning" | "danger";
}

export interface ICognitoInitParams {
    region: string;
    userPoolId: string;
    clientId: string;
}

export interface ICognitoPresenter {
    vm: {
        authState: AuthState;
        authData: AuthData | null;
        message: AuthMessage | null;
        checkingUser: boolean;
    };
    init(params: ICognitoInitParams): Promise<void>;
    changeState(
        state: AuthState,
        data?: AuthData | null,
        message?: AuthMessage | null
    ): Promise<void>;
}

export const CognitoPresenter = createAbstraction<ICognitoPresenter>("CognitoPresenter");

export namespace CognitoPresenter {
    export type Interface = ICognitoPresenter;
}

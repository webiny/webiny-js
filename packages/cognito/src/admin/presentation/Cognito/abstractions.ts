import { createAbstraction } from "@webiny/feature/admin";
import type { IFederatedProvider } from "./CognitoSignInConfig.js";

export type AuthState =
    | "signIn"
    | "signedIn"
    | "signedOut"
    | "requestPasswordResetCode"
    | "passwordResetCodeSent"
    | "setNewPassword"
    | "requireNewPassword"
    | "confirmTotpCode"
    | "setupTotp";

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
    requiredAttributes?: string[];
    [key: string]:
        | string
        | null
        | boolean
        | undefined
        | string[]
        | AuthDataVerified
        | AuthDataUnverified;
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

export interface SignInVM {
    isLoading: boolean;
    message: AuthMessage | null;
    title: string;
    description: string | undefined;
    allowCredentialsLogin: boolean;
    federatedProviders: IFederatedProvider[];
}

export interface RequireNewPasswordVM {
    isLoading: boolean;
    requiredAttributes: string[];
}

export interface RequestPasswordResetCodeVM {
    isLoading: boolean;
    message: AuthMessage | null;
}

export interface PasswordResetCodeSentVM {
    isLoading: boolean;
    message: AuthMessage | null;
}

export interface SetNewPasswordVM {
    isLoading: boolean;
    message: AuthMessage | null;
}

export interface ConfirmTotpCodeVM {
    isLoading: boolean;
    message: AuthMessage | null;
}

export interface SetupTotpVM {
    isLoading: boolean;
    sharedSecret: string;
    qrCodeUri: string;
    message: AuthMessage | null;
}

export interface ICognitoPresenter {
    vm: {
        authState: AuthState;
        checkingSession: boolean;
        isLoggingIn: boolean;
        isAuthenticated: boolean;
        signIn: SignInVM;
        requireNewPassword: RequireNewPasswordVM;
        requestPasswordResetCode: RequestPasswordResetCodeVM;
        passwordResetCodeSent: PasswordResetCodeSentVM;
        setNewPassword: SetNewPasswordVM;
        confirmTotpCode: ConfirmTotpCodeVM;
        setupTotp: SetupTotpVM;
    };

    // Lifecycle
    init(params: ICognitoInitParams): Promise<void>;

    // Authentication actions
    signIn(username: string, password: string): Promise<void>;
    confirmNewPassword(password: string, requiredAttributes: any): Promise<void>;
    requestPasswordReset(username: string): Promise<void>;
    resendPasswordResetCode(): Promise<void>;
    confirmPasswordReset(code: string, password: string): Promise<void>;
    confirmTotpCode(code: string): Promise<void>;
    verifyTotpSetup(code: string): Promise<void>;

    // Navigation actions
    showSignIn(): void;
    showRequestPasswordResetCode(): void;
    showSetNewPassword(): void;
}

export const CognitoPresenter = createAbstraction<ICognitoPresenter>("CognitoPresenter");

export namespace CognitoPresenter {
    export type Interface = ICognitoPresenter;
}

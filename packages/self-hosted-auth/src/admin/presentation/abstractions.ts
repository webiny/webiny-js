import { createAbstraction } from "@webiny/feature/admin";

/**
 * Which of the four screens the login view is showing. The self-hosted IdP has no MFA and no forced
 * password change, so this is a shorter list than Cognito's.
 */
export type AuthScreen = "signIn" | "requestResetCode" | "resetCodeSent" | "setNewPassword";

export interface AuthMessage {
    title: string;
    text: string;
    type: "success" | "info" | "warning" | "danger";
}

export interface FormVM {
    isLoading: boolean;
    message: AuthMessage | null;
}

export interface SignInVM extends FormVM {
    /** Whether to offer "Forgot password?" at all. Off when the project disabled the flow. */
    passwordResetEnabled: boolean;
}

export interface ResetCodeSentVM extends FormVM {
    /** Shown back to the user so they know which mailbox to open. */
    email: string;
}

export interface SelfHostedAuthVM {
    screen: AuthScreen;
    isAuthenticated: boolean;
    checkingSession: boolean;
    isSigningIn: boolean;
    signIn: SignInVM;
    requestResetCode: FormVM;
    resetCodeSent: ResetCodeSentVM;
    setNewPassword: FormVM;
}

export interface SelfHostedAuthInitParams {
    /** Whether the project left the emailed reset flow on. Baked into the bundle at build time. */
    passwordResetEnabled: boolean;
}

export interface ISelfHostedAuthPresenter {
    readonly vm: SelfHostedAuthVM;

    init(params: SelfHostedAuthInitParams): void;

    signIn(email: string, password: string): Promise<void>;

    showSignIn(): void;
    showRequestResetCode(): void;
    showSetNewPassword(): void;

    requestResetCode(email: string): Promise<void>;
    resendResetCode(): Promise<void>;
    resetPassword(code: string, password: string): Promise<void>;
}

/**
 * Everything the self-hosted login view does. The view is four forms and a switch; all of the state
 * (which screen, what is loading, what went wrong, which address a code was sent to) lives here, so
 * the screens stay presentational and the flow can be tested without rendering anything.
 */
export const SelfHostedAuthPresenter =
    createAbstraction<ISelfHostedAuthPresenter>("SelfHostedAuthPresenter");

export namespace SelfHostedAuthPresenter {
    export type Interface = ISelfHostedAuthPresenter;
    export type Vm = SelfHostedAuthVM;
    export type InitParams = SelfHostedAuthInitParams;
}

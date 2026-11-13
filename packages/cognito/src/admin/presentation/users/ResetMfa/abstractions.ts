import { createAbstraction } from "@webiny/feature/admin";

export interface ResetMfaUser {
    id: string;
    email: string;
    external?: boolean;
}

export interface ResetMfaVM {
    /** Whether the user's MFA can be reset here: not for a federated user, nor for yourself. */
    available: boolean;
    resetting: boolean;
}

export type ResetMfaResult =
    | { type: "reset"; message: string }
    | { type: "failed"; message: string };

export interface ResetMfaInitParams {
    /** The user the form shows. */
    user: ResetMfaUser | undefined;
    /** The ID of the person signed in. */
    currentIdentityId: string | undefined;
}

export interface IResetMfaPresenter {
    vm: ResetMfaVM;

    /** Starts the presenter's lifecycle. Calling it again replaces the params. */
    init(params: ResetMfaInitParams): void;

    /** Deletes the user's TOTP software token, so they set up MFA again on their next sign-in. */
    reset(): Promise<ResetMfaResult>;
}

export const ResetMfaPresenter = createAbstraction<IResetMfaPresenter>("Cognito/ResetMfaPresenter");

export namespace ResetMfaPresenter {
    export type Interface = IResetMfaPresenter;
    export type VM = ResetMfaVM;
    export type User = ResetMfaUser;
    export type InitParams = ResetMfaInitParams;
    export type Result = ResetMfaResult;
}

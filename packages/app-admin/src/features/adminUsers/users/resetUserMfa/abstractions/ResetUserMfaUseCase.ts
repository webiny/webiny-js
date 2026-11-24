import { createAbstraction } from "@webiny/feature/admin";

export interface IResetUserMfaUseCaseParams {
    id: string;
}

export interface IResetUserMfaUseCase {
    /** Deletes the user's TOTP software token, so they set up MFA again on their next sign-in. */
    execute(params: IResetUserMfaUseCaseParams): Promise<boolean>;
}

export const ResetUserMfaUseCase = createAbstraction<IResetUserMfaUseCase>("ResetUserMfaUseCase");

export namespace ResetUserMfaUseCase {
    export type Interface = IResetUserMfaUseCase;
    export type Params = IResetUserMfaUseCaseParams;
}

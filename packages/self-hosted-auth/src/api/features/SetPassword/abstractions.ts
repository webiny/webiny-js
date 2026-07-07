import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { WeakPasswordError, NotAuthorizedError } from "~/api/domain/errors.js";

export interface SetPasswordInput {
    userId: string;
    email: string;
    password: string;
}

export type SetPasswordError = WeakPasswordError | NotAuthorizedError;

export interface ISetPasswordUseCase {
    execute(input: SetPasswordInput): Promise<Result<true, SetPasswordError>>;
}

/**
 * Creates or replaces a user's credential. Used to seed the first admin and to
 * change passwords. Authorization is the caller's responsibility (see the TODO
 * in the implementation).
 */
export const SetPasswordUseCase = createAbstraction<ISetPasswordUseCase>("SetPasswordUseCase");

export namespace SetPasswordUseCase {
    export type Interface = ISetPasswordUseCase;
    export type Input = SetPasswordInput;
    export type Error = SetPasswordError;
}

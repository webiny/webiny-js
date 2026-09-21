import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { CredentialsPersistenceError } from "~/api/domain/errors.js";

export interface DeleteCredentialInput {
    userId: string;
}

export type DeleteCredentialError = CredentialsPersistenceError;

export interface IDeleteCredentialUseCase {
    execute(input: DeleteCredentialInput): Promise<Result<true, DeleteCredentialError>>;
}

/**
 * Removes a user's stored password.
 *
 * Deleting an admin user does not cascade to credentials, so whoever deletes the user has to delete
 * this too. Worth a use case of its own rather than letting callers reach for the repository: a
 * credential left behind still holds its address, and the address is unique, so the next install
 * using it would fail on a constraint with nothing to explain why.
 */
export const DeleteCredentialUseCase =
    createAbstraction<IDeleteCredentialUseCase>("DeleteCredentialUseCase");

export namespace DeleteCredentialUseCase {
    export type Interface = IDeleteCredentialUseCase;
    export type Input = DeleteCredentialInput;
    export type Error = DeleteCredentialError;
}

import { createAbstraction } from "@webiny/feature/api";

export interface IDeleteCredentialStorageOperation {
    execute(params: { userId: string }): Promise<void>;
}

/**
 * Removes a user's credential. Deleting the user does not cascade, so both are removed.
 */
export const DeleteCredentialStorageOperation =
    createAbstraction<IDeleteCredentialStorageOperation>(
        "SelfHostedAuth/Credential/DeleteStorageOperation"
    );

export namespace DeleteCredentialStorageOperation {
    export type Interface = IDeleteCredentialStorageOperation;
}

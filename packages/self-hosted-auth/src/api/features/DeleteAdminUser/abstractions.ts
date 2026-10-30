import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { NotAuthorizedError } from "@webiny/api-core/features/users/shared/errors.js";
import type { DeleteUserUseCase as CoreDeleteUser } from "@webiny/api-core/features/users/DeleteUser/index.js";
import type { GetUserUseCase } from "@webiny/api-core/features/users/GetUser/index.js";
import type { DeleteCredentialUseCase } from "~/api/features/DeleteCredential/index.js";

export type DeleteAdminUserError =
    | NotAuthorizedError
    | GetUserUseCase.Error
    | CoreDeleteUser.Error
    | DeleteCredentialUseCase.Error;

export interface IDeleteAdminUserUseCase {
    execute(id: string): Promise<Result<void, DeleteAdminUserError>>;
}

/** Deletes an admin user together with its credential. */
export const DeleteAdminUserUseCase =
    createAbstraction<IDeleteAdminUserUseCase>("DeleteAdminUserUseCase");

export namespace DeleteAdminUserUseCase {
    export type Interface = IDeleteAdminUserUseCase;
    export type Error = DeleteAdminUserError;
}

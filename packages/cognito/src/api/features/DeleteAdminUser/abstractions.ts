import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { NotAuthorizedError } from "@webiny/api-core/features/users/shared/errors.js";
import type { DeleteUserUseCase } from "@webiny/api-core/features/users/DeleteUser/index.js";
import type { CognitoDeleteUserError } from "~/api/domain/errors.js";

export interface IDeleteAdminUserUseCaseErrors {
    authorization: NotAuthorizedError;
    deleteUser: DeleteUserUseCase.Error;
    cognitoDeleteUser: CognitoDeleteUserError;
}

type IDeleteAdminUserError = IDeleteAdminUserUseCaseErrors[keyof IDeleteAdminUserUseCaseErrors];

export interface IDeleteAdminUserUseCase {
    execute(id: string): Promise<Result<void, IDeleteAdminUserError>>;
}

export const DeleteAdminUserUseCase =
    createAbstraction<IDeleteAdminUserUseCase>("DeleteAdminUserUseCase");

export namespace DeleteAdminUserUseCase {
    export type Interface = IDeleteAdminUserUseCase;
    export type Error = IDeleteAdminUserError;
}

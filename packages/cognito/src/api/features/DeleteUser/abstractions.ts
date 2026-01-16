import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { NotAuthorizedError } from "@webiny/api-core/features/users/shared/errors.js";
import type { DeleteUserUseCase as CoreDeleteUser } from "@webiny/api-core/features/users/DeleteUser/index.js";
import type { CognitoDeleteUserError } from "~/api/domain/errors.js";

export interface IDeleteUserUseCaseErrors {
    authorization: NotAuthorizedError;
    deleteUser: CoreDeleteUser.Error;
    cognitoDeleteUser: CognitoDeleteUserError;
}

type IDeleteAdminUserError = IDeleteUserUseCaseErrors[keyof IDeleteUserUseCaseErrors];

export interface IDeleteUserUseCase {
    execute(id: string): Promise<Result<void, IDeleteAdminUserError>>;
}

export const DeleteUserUseCase =
    createAbstraction<IDeleteUserUseCase>("DeleteUserUseCase");

export namespace DeleteUserUseCase {
    export type Interface = IDeleteUserUseCase;
    export type Error = IDeleteAdminUserError;
}

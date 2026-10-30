import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { AdminUser } from "@webiny/api-core/types/users.js";
import type { NotAuthorizedError } from "@webiny/api-core/features/users/shared/errors.js";
import type { UpdateAdminUserUseCase } from "~/api/features/UpdateAdminUser/index.js";

/** What a user may change about their own account. Roles and teams are left out on purpose. */
export interface UpdateCurrentAdminUserInput {
    email?: string;
    firstName?: string;
    lastName?: string;
    password?: string;
    avatar?: Record<string, any> | null;
}

export type UpdateCurrentAdminUserError = NotAuthorizedError | UpdateAdminUserUseCase.Error;

export interface IUpdateCurrentAdminUserUseCase {
    execute(
        input: UpdateCurrentAdminUserInput
    ): Promise<Result<AdminUser, UpdateCurrentAdminUserError>>;
}

/** Lets a signed-in admin user change their own details and password. */
export const UpdateCurrentAdminUserUseCase = createAbstraction<IUpdateCurrentAdminUserUseCase>(
    "UpdateCurrentAdminUserUseCase"
);

export namespace UpdateCurrentAdminUserUseCase {
    export type Interface = IUpdateCurrentAdminUserUseCase;
    export type Input = UpdateCurrentAdminUserInput;
    export type Error = UpdateCurrentAdminUserError;
}

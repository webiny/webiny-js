import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { AdminUser } from "@webiny/api-core/types/users.js";
import type {
    NotAuthorizedError,
    UserValidationError
} from "@webiny/api-core/features/users/shared/errors.js";
import type { CreateUserUseCase as CoreCreateUser } from "@webiny/api-core/features/users/CreateUser/index.js";
import type { FindUserRecordsUseCase } from "@webiny/api-core/features/users/FindUserRecords/index.js";
import type {
    CognitoAccountExistsError,
    CognitoAccountNotFoundError,
    CognitoGetUserError
} from "~/api/domain/errors.js";

export interface LinkAdminUserInput {
    email: string;
    roles?: string[];
    teams?: string[];
}

export interface ILinkUserUseCaseErrors {
    authorization: NotAuthorizedError;
    validation: UserValidationError;
    createUser: CoreCreateUser.Error;
    findUserRecords: FindUserRecordsUseCase.Error;
    cognitoAccountExists: CognitoAccountExistsError;
    cognitoAccountNotFound: CognitoAccountNotFoundError;
    cognitoGetUser: CognitoGetUserError;
}

type LinkAdminUserError = ILinkUserUseCaseErrors[keyof ILinkUserUseCaseErrors];

/**
 * Gives a person whose account already exists in another tenant access to the current tenant,
 * with the given roles and teams. Their account (name, email, password) stays as it is.
 */
export interface ILinkUserUseCase {
    execute(input: LinkAdminUserInput): Promise<Result<AdminUser, LinkAdminUserError>>;
}

export const LinkUserUseCase = createAbstraction<ILinkUserUseCase>("LinkUserUseCase");

export namespace LinkUserUseCase {
    export type Interface = ILinkUserUseCase;
    export type Input = LinkAdminUserInput;
    export type Output = AdminUser;
    export type Error = LinkAdminUserError;
}

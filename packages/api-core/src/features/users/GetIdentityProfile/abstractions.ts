import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { AdminUser } from "~/features/users/shared/types.js";
import { AdminUsersRepository } from "~/features/users/shared/abstractions.js";
import { NotAuthorizedError } from "~/features/users/shared/errors.js";

// Use case specific errors
export interface IGetIdentityProfileErrors {
    notAuthorized: NotAuthorizedError;
}

// Combined error type (use case errors + repository errors)
type GetIdentityProfileError =
    | IGetIdentityProfileErrors[keyof IGetIdentityProfileErrors]
    | AdminUsersRepository.Error;

// Use case interface
export interface IGetIdentityProfile {
    execute(identityId: string): Promise<Result<AdminUser, GetIdentityProfileError>>;
}

// Abstraction constant
export const GetIdentityProfileUseCase = createAbstraction<IGetIdentityProfile>(
    "GetIdentityProfileUseCase"
);

// Namespace exports
export namespace GetIdentityProfileUseCase {
    export type Interface = IGetIdentityProfile;
    export type Return = Promise<Result<AdminUser, GetIdentityProfileError>>;
    export type Error = GetIdentityProfileError;
}

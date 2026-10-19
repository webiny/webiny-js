import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { AdminExtension } from "~/api/adminExtensions/domain/AdminExtension.js";
import type { AdminExtensionModelNotFoundError } from "~/api/adminExtensions/domain/errors.js";
import type { AdminExtensionNotAuthorizedError } from "~/api/adminExtensions/domain/errors.js";
import type { AdminExtensionNotFoundError } from "~/api/adminExtensions/domain/errors.js";
import type { AdminExtensionPersistenceError } from "~/api/adminExtensions/domain/errors.js";
import type { AdminExtensionValidationError } from "~/api/adminExtensions/domain/errors.js";

export interface ISetAdminExtensionEnabledInput {
    id: string;
    enabled: boolean;
}

type IRepositoryError =
    | AdminExtensionModelNotFoundError
    | AdminExtensionNotFoundError
    | AdminExtensionPersistenceError;

type IUseCaseError =
    | IRepositoryError
    | AdminExtensionNotAuthorizedError
    | AdminExtensionValidationError;

export interface ISetAdminExtensionEnabledUseCase {
    execute(input: ISetAdminExtensionEnabledInput): Promise<Result<AdminExtension, IUseCaseError>>;
}

/**
 * Turns an admin extension on or off without deleting it. A disabled extension stays listed for
 * whoever manages extensions, and the admin does not load it.
 */
export const SetAdminExtensionEnabledUseCase = createAbstraction<ISetAdminExtensionEnabledUseCase>(
    "RemoteComponents/SetAdminExtensionEnabledUseCase"
);

export namespace SetAdminExtensionEnabledUseCase {
    export type Interface = ISetAdminExtensionEnabledUseCase;
    export type Input = ISetAdminExtensionEnabledInput;
    export type Error = IUseCaseError;
}

export interface ISetAdminExtensionEnabledRepository {
    execute(
        input: ISetAdminExtensionEnabledInput
    ): Promise<Result<AdminExtension, IRepositoryError>>;
}

export const SetAdminExtensionEnabledRepository =
    createAbstraction<ISetAdminExtensionEnabledRepository>(
        "RemoteComponents/SetAdminExtensionEnabledRepository"
    );

export namespace SetAdminExtensionEnabledRepository {
    export type Interface = ISetAdminExtensionEnabledRepository;
    export type Error = IRepositoryError;
}

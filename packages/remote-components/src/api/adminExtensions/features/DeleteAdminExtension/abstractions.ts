import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { AdminExtensionModelNotFoundError } from "~/api/adminExtensions/domain/errors.js";
import type { AdminExtensionNotAuthorizedError } from "~/api/adminExtensions/domain/errors.js";
import type { AdminExtensionNotFoundError } from "~/api/adminExtensions/domain/errors.js";
import type { AdminExtensionPersistenceError } from "~/api/adminExtensions/domain/errors.js";
import type { AdminExtensionValidationError } from "~/api/adminExtensions/domain/errors.js";

type IRepositoryError =
    | AdminExtensionModelNotFoundError
    | AdminExtensionNotFoundError
    | AdminExtensionPersistenceError;

type IUseCaseError =
    | IRepositoryError
    | AdminExtensionNotAuthorizedError
    | AdminExtensionValidationError;

export interface IDeleteAdminExtensionUseCase {
    execute(id: string): Promise<Result<boolean, IUseCaseError>>;
}

/** Deletes an admin extension for good. Nothing keeps a copy, unlike disabling it. */
export const DeleteAdminExtensionUseCase = createAbstraction<IDeleteAdminExtensionUseCase>(
    "RemoteComponents/DeleteAdminExtensionUseCase"
);

export namespace DeleteAdminExtensionUseCase {
    export type Interface = IDeleteAdminExtensionUseCase;
    export type Error = IUseCaseError;
}

export interface IDeleteAdminExtensionRepository {
    execute(id: string): Promise<Result<boolean, IRepositoryError>>;
}

export const DeleteAdminExtensionRepository = createAbstraction<IDeleteAdminExtensionRepository>(
    "RemoteComponents/DeleteAdminExtensionRepository"
);

export namespace DeleteAdminExtensionRepository {
    export type Interface = IDeleteAdminExtensionRepository;
    export type Error = IRepositoryError;
}

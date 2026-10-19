import { createAbstraction, type Result } from "@webiny/feature/api";
import type { AdminExtension } from "~/api/adminExtensions/domain/AdminExtension.js";
import type { AdminExtensionKind } from "~/shared/adminExtensions/constants.js";
import type { AdminExtensionValues } from "~/api/adminExtensions/domain/AdminExtension.js";
import type {
    AdminExtensionAlreadyExistsError,
    AdminExtensionModelNotFoundError,
    AdminExtensionNotAuthorizedError,
    AdminExtensionPersistenceError,
    AdminExtensionValidationError
} from "~/api/adminExtensions/domain/errors.js";

export interface ICreateAdminExtensionInput {
    kind: AdminExtensionKind;
    name: string;
    label: string;
    description?: string;
    source: string;
}

type IRepositoryError = AdminExtensionModelNotFoundError | AdminExtensionPersistenceError;

type IUseCaseError =
    | IRepositoryError
    | AdminExtensionNotAuthorizedError
    | AdminExtensionValidationError
    | AdminExtensionAlreadyExistsError;

export interface ICreateAdminExtensionUseCase {
    execute(input: ICreateAdminExtensionInput): Promise<Result<AdminExtension, IUseCaseError>>;
}

/**
 * Stores a new admin extension, enabled, stamped with the current runtime version.
 *
 * A name is unique within its kind: it is what a field or a menu refers to, so two of them would
 * leave the loader to guess which one was meant.
 */
export const CreateAdminExtensionUseCase = createAbstraction<ICreateAdminExtensionUseCase>(
    "RemoteComponents/CreateAdminExtensionUseCase"
);

export namespace CreateAdminExtensionUseCase {
    export type Interface = ICreateAdminExtensionUseCase;
    export type Input = ICreateAdminExtensionInput;
    export type Error = IUseCaseError;
}

export interface ICreateAdminExtensionRepository {
    execute(values: AdminExtensionValues): Promise<Result<AdminExtension, IRepositoryError>>;
}

export const CreateAdminExtensionRepository = createAbstraction<ICreateAdminExtensionRepository>(
    "RemoteComponents/CreateAdminExtensionRepository"
);

export namespace CreateAdminExtensionRepository {
    export type Interface = ICreateAdminExtensionRepository;
    export type Error = IRepositoryError;
}

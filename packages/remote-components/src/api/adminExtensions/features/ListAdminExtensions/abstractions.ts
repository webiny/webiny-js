import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { AdminExtension } from "~/api/adminExtensions/domain/AdminExtension.js";
import type { AdminExtensionKind } from "~/shared/adminExtensions/constants.js";
import type { AdminExtensionModelNotFoundError } from "~/api/adminExtensions/domain/errors.js";
import type { AdminExtensionNotAuthorizedError } from "~/api/adminExtensions/domain/errors.js";
import type { AdminExtensionPersistenceError } from "~/api/adminExtensions/domain/errors.js";
import type { AdminExtensionValidationError } from "~/api/adminExtensions/domain/errors.js";

export interface IListAdminExtensionsInput {
    kind?: AdminExtensionKind;
    enabled?: boolean;
}

export interface IListAdminExtensionsWhere extends IListAdminExtensionsInput {
    name?: string;
}

type IRepositoryError = AdminExtensionModelNotFoundError | AdminExtensionPersistenceError;

type IUseCaseError =
    | IRepositoryError
    | AdminExtensionNotAuthorizedError
    | AdminExtensionValidationError;

export interface IListAdminExtensionsUseCase {
    execute(input?: IListAdminExtensionsInput): Promise<Result<AdminExtension[], IUseCaseError>>;
}

/** Lists admin extensions, newest first, for whoever manages them. */
export const ListAdminExtensionsUseCase = createAbstraction<IListAdminExtensionsUseCase>(
    "RemoteComponents/ListAdminExtensionsUseCase"
);

export namespace ListAdminExtensionsUseCase {
    export type Interface = IListAdminExtensionsUseCase;
    export type Input = IListAdminExtensionsInput;
    export type Error = IUseCaseError;
}

export interface IListAdminExtensionsRepository {
    /** Returns every match, not one page: callers need the whole set to resolve names. */
    execute(where: IListAdminExtensionsWhere): Promise<Result<AdminExtension[], IRepositoryError>>;
}

export const ListAdminExtensionsRepository = createAbstraction<IListAdminExtensionsRepository>(
    "RemoteComponents/ListAdminExtensionsRepository"
);

export namespace ListAdminExtensionsRepository {
    export type Interface = IListAdminExtensionsRepository;
    export type Where = IListAdminExtensionsWhere;
    export type Error = IRepositoryError;
}

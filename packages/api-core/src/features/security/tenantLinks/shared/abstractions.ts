import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type {
    CreateTenantLinkInput,
    UpdateTenantLinkInput,
    DeleteTenantLinkInput,
    ListTenantLinksByTypeInput,
    ListTenantLinksByTenantInput,
    ListTenantLinksByIdentityInput,
    GetTenantLinkByIdentityInput,
    TenantLink
} from "./types.js";
import { TenantLinkStorageError, TenantLinkNotFoundError } from "./errors.js";

export interface ITenantLinksRepositoryErrors {
    base: TenantLinkStorageError | TenantLinkNotFoundError;
}

type RepositoryError = ITenantLinksRepositoryErrors[keyof ITenantLinksRepositoryErrors];

export interface ITenantLinksRepository {
    createBatch(inputs: CreateTenantLinkInput[]): Promise<Result<void, RepositoryError>>;
    updateBatch(inputs: UpdateTenantLinkInput[]): Promise<Result<void, RepositoryError>>;
    deleteBatch(inputs: DeleteTenantLinkInput[]): Promise<Result<void, RepositoryError>>;
    listByType<TLink extends TenantLink = TenantLink>(
        input: ListTenantLinksByTypeInput
    ): Promise<Result<TLink[], RepositoryError>>;
    listByTenant(
        input: ListTenantLinksByTenantInput
    ): Promise<Result<TenantLink[], RepositoryError>>;
    listByIdentity(
        input: ListTenantLinksByIdentityInput
    ): Promise<Result<TenantLink[], RepositoryError>>;
    getByIdentity<TLink extends TenantLink = TenantLink>(
        input: GetTenantLinkByIdentityInput
    ): Promise<Result<TLink | null, RepositoryError>>;
}

export const TenantLinksRepository =
    createAbstraction<ITenantLinksRepository>("TenantLinksRepository");

export namespace TenantLinksRepository {
    export type Interface = ITenantLinksRepository;
    export type Error = RepositoryError;
}

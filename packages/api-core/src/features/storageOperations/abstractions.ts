import { createAbstraction } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import type { ApiCoreStorageOperations } from "~/types/core.js";
import type { TenancyStorageOperations } from "~/types/tenancy.js";

/**
 * Builds the api-core storage operations. Resolved + built synchronously inside
 * ApiCoreFeature.register, so storage is wired the same way for every event — there is no
 * out-of-feature construction or per-request async initializer. The concrete implementation is
 * provided by a storage adapter (ApiCoreDdbFeature / ApiCoreSqlFeature) or, in tests, by
 * registerApiCoreStorageOperations.
 */
export interface IApiCoreStorageOperationsFactory {
    create(): ApiCoreStorageOperations;
}

export const ApiCoreStorageOperationsFactory = createAbstraction<IApiCoreStorageOperationsFactory>(
    "ApiCoreStorageOperationsFactory"
);

export namespace ApiCoreStorageOperationsFactory {
    export type Interface = IApiCoreStorageOperationsFactory;
}

/**
 * Register pre-built storage operations as the factory. Used by tests (and anywhere the ops are
 * already constructed) so ApiCoreFeature.register can resolve them like any adapter-provided factory.
 */
export const registerApiCoreStorageOperations = (
    container: Container,
    storageOperations: ApiCoreStorageOperations
): void => {
    container.registerInstance(ApiCoreStorageOperationsFactory, {
        create: () => storageOperations
    });
};

/**
 * Builds the storage operations of the tenant registry (the tenant records) on their own, without
 * the rest of the core storage. The request container builds the registry before the request's
 * tenant is known, and the core storage's other parts (security, users, the key-value store) belong
 * to a tenant scope. Registered in the root by a storage adapter (ApiCoreDdbFeature,
 * SqlConnectionFeature). When none is, the registry takes the tenancy part of
 * `ApiCoreStorageOperationsFactory` (tests register only that one).
 */
export interface ITenancyStorageOperationsFactory {
    create(): TenancyStorageOperations;
}

export const TenancyStorageOperationsFactory = createAbstraction<ITenancyStorageOperationsFactory>(
    "TenancyStorageOperationsFactory"
);

export namespace TenancyStorageOperationsFactory {
    export type Interface = ITenancyStorageOperationsFactory;
}

/**
 * Picks the tenant registry's storage: its own `TenancyStorageOperationsFactory`, or the tenancy
 * part of `ApiCoreStorageOperationsFactory`.
 */
export interface ITenancyStorageOperationsProvider {
    create(): TenancyStorageOperations;
}

export const TenancyStorageOperationsProvider =
    createAbstraction<ITenancyStorageOperationsProvider>("TenancyStorageOperationsProvider");

export namespace TenancyStorageOperationsProvider {
    export type Interface = ITenancyStorageOperationsProvider;
}

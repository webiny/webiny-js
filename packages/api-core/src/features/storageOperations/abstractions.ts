import { createAbstraction } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import type { ApiCoreStorageOperations } from "~/types/core.js";
import type { TenancyStorageOperations } from "~/types/tenancy.js";
import type { ScopeTenant } from "~/features/tenancy/ScopeTenant/abstractions.js";

export interface ApiCoreStorageOperationsFactoryParams {
    /**
     * The tenant the storage acts on: its tenant scope's. The storage takes every tenant it reads
     * and writes from here, and throws when a caller passes another one.
     */
    scopeTenant: ScopeTenant.Interface;
}

/**
 * Builds the api-core storage operations. Resolved + built synchronously inside
 * ApiCoreFeature.register, so storage is wired the same way for every event — there is no
 * out-of-feature construction or per-request async initializer. The concrete implementation is
 * provided by a storage adapter (ApiCoreDdbFeature / ApiCoreSqlFeature) or, in tests, by
 * registerApiCoreStorageOperations.
 */
export interface IApiCoreStorageOperationsFactory {
    create(params: ApiCoreStorageOperationsFactoryParams): ApiCoreStorageOperations;
}

export const ApiCoreStorageOperationsFactory = createAbstraction<IApiCoreStorageOperationsFactory>(
    "ApiCoreStorageOperationsFactory"
);

export namespace ApiCoreStorageOperationsFactory {
    export type Interface = IApiCoreStorageOperationsFactory;
    export type Params = ApiCoreStorageOperationsFactoryParams;
}

/** Builds the core storage operations for a tenant scope. */
export type ApiCoreStorageOperationsBuilder = (
    params: ApiCoreStorageOperationsFactoryParams
) => ApiCoreStorageOperations;

/**
 * Register storage operations as the factory, so ApiCoreFeature.register resolves them like any
 * adapter-provided factory. Used by tests: a builder gets each scope's tenant; pre-built storage
 * operations act on whatever tenant their own construction gave them.
 */
export const registerApiCoreStorageOperations = (
    container: Container,
    storageOperations: ApiCoreStorageOperations | ApiCoreStorageOperationsBuilder
): void => {
    container.registerInstance(ApiCoreStorageOperationsFactory, {
        create: params =>
            typeof storageOperations === "function" ? storageOperations(params) : storageOperations
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

import { createAbstraction } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import type { ApiCoreStorageOperations } from "~/types/core.js";

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

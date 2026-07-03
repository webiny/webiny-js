import { createAbstraction, Result } from "@webiny/feature/api";
import type { CmsModel } from "~/types/index.js";
import type { ICache } from "~/utils/caching/types.js";
import type { CmsModelPlugin } from "~/plugins/CmsModelPlugin.js";
import { ModelNotFoundError, ModelPersistenceError } from "~/domain/contentModel/errors.js";

/**
 * Multi-instance DI token holding the code-defined CmsModelPlugin instances
 * (previously read from the plugins container via byType). PluginModelsProvider
 * resolves all of these to expose plugin-defined models.
 */
export const CmsModelPluginInstance = createAbstraction<CmsModelPlugin>("CmsModelPluginInstance");

export namespace CmsModelPluginInstance {
    export type Interface = CmsModelPlugin;
}

/**
 * PluginModelsProvider provides access to plugin-defined (code) models.
 */
export interface IPluginModelsProvider {
    list(tenant: string): Promise<CmsModel[]>;
}

export const PluginModelsProvider =
    createAbstraction<IPluginModelsProvider>("PluginModelsProvider");

export namespace PluginModelsProvider {
    export type Interface = IPluginModelsProvider;
}

export const ModelCache = createAbstraction<ICache<Promise<CmsModel[]>>>("ModelCache");

export namespace ModelCache {
    export type Interface = ICache<Promise<CmsModel[]>>;
}

/**
 * ModelsFetcher - Centralized model fetching with caching.
 *
 * This abstraction handles fetching models from both plugins and database,
 * applies access control filtering, and caches the results for optimal performance.
 */
export interface IModelsFetcher {
    /**
     * Fetch all accessible models for the current tenant and identity.
     * Results are cached based on tenant + identity.
     */
    fetchAll(): Promise<Result<CmsModel[], ModelsFetcherError>>;

    /**
     * Fetch a single model by modelId.
     * Uses the cached fetchAll result.
     */
    fetchById(modelId: string): Promise<Result<CmsModel, ModelsFetcherError>>;
}

export interface IModelsFetcherErrors {
    notFound: ModelNotFoundError;
    persistence: ModelPersistenceError;
}

type ModelsFetcherError = IModelsFetcherErrors[keyof IModelsFetcherErrors];

export const ModelsFetcher = createAbstraction<IModelsFetcher>("ModelsFetcher");

export namespace ModelsFetcher {
    export type Interface = IModelsFetcher;
    export type Error = ModelsFetcherError;

    export type FetchAllReturn = Promise<Result<CmsModel[], ModelsFetcherError>>;
    export type FetchByIdReturn = Promise<Result<CmsModel, ModelsFetcherError>>;
}

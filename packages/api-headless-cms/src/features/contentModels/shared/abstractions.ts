import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { CmsModel } from "~/types/index.js";
import type {
    ModelNotFoundError,
    ModelStorageError,
    ModelCannotUpdateCodeDefinedError,
    ModelCannotDeleteCodeDefinedError
} from "~/domains/contentModels/errors.js";

export interface IModelsRepositoryErrors {
    base:
        | ModelNotFoundError
        | ModelStorageError
        | ModelCannotUpdateCodeDefinedError
        | ModelCannotDeleteCodeDefinedError;
}

type RepositoryError = IModelsRepositoryErrors[keyof IModelsRepositoryErrors];

/**
 * ModelsRepository follows CQS (Command-Query Separation):
 * - Queries (get, list): Return data wrapped in Result
 * - Commands (create, update, delete): Return Result<void, Error>
 *
 * This repository provides unified access to both database-stored models
 * and plugin-defined (code) models, transparently handling access control.
 */
export interface IModelsRepository {
    /**
     * Get a single model by ID.
     * Checks plugin models first, then database models.
     * Applies access control.
     */
    get(modelId: string): Promise<Result<CmsModel, RepositoryError>>;

    /**
     * List all accessible models.
     * Combines plugin models and database models.
     * Applies access control to all results.
     */
    list(): Promise<Result<CmsModel[], RepositoryError>>;

    /**
     * Create a new model in the database.
     * Plugin models cannot be created (they are code-defined).
     */
    create(model: CmsModel): Promise<Result<void, RepositoryError>>;

    /**
     * Update an existing database model.
     * Plugin models cannot be updated.
     */
    update(model: CmsModel): Promise<Result<void, RepositoryError>>;

    /**
     * Delete a database model.
     * Plugin models cannot be deleted.
     */
    delete(model: CmsModel): Promise<Result<void, RepositoryError>>;
}

export const ModelsRepository = createAbstraction<IModelsRepository>("ModelsRepository");

export namespace ModelsRepository {
    export type Interface = IModelsRepository;
    export type Error = RepositoryError;
}

/**
 * PluginModelsProvider provides access to plugin-defined (code) models.
 */
export interface IPluginModelsProvider {
    getModels(): Promise<CmsModel[]>;
}

export const PluginModelsProvider =
    createAbstraction<IPluginModelsProvider>("PluginModelsProvider");

export namespace PluginModelsProvider {
    export type Interface = IPluginModelsProvider;
}

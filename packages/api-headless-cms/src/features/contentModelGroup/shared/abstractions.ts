import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { CmsGroup } from "~/types/index.js";
import type {
    GroupNotFoundError,
    GroupStorageError,
    GroupCannotUpdateCodeDefinedError,
    GroupCannotDeleteCodeDefinedError
} from "~/domain/contentModelGroup/errors.js";

export interface IGroupsRepositoryErrors {
    base:
        | GroupNotFoundError
        | GroupStorageError
        | GroupCannotUpdateCodeDefinedError
        | GroupCannotDeleteCodeDefinedError;
}

type RepositoryError = IGroupsRepositoryErrors[keyof IGroupsRepositoryErrors];

/**
 * GroupsRepository follows CQS (Command-Query Separation):
 * - Queries (get, list): Return data wrapped in Result
 * - Commands (create, update, delete): Return Result<void, Error>
 *
 * This repository provides unified access to both database-stored groups
 * and plugin-defined (code) groups, transparently handling access control.
 */
export interface IGroupsRepository {
    /**
     * Get a single group by ID.
     * Checks plugin groups first, then database groups.
     * Applies access control.
     */
    get(groupId: string): Promise<Result<CmsGroup, RepositoryError>>;

    /**
     * List all accessible groups.
     * Combines plugin groups and database groups.
     * Applies access control to all results.
     */
    list(): Promise<Result<CmsGroup[], RepositoryError>>;

    /**
     * Create a new group in the database.
     * Plugin groups cannot be created (they are code-defined).
     */
    create(group: CmsGroup): Promise<Result<void, RepositoryError>>;

    /**
     * Update an existing database group.
     * Plugin groups cannot be updated.
     */
    update(group: CmsGroup): Promise<Result<void, RepositoryError>>;

    /**
     * Delete a database group.
     * Plugin groups cannot be deleted.
     */
    delete(group: CmsGroup): Promise<Result<void, RepositoryError>>;
}

export const GroupsRepository = createAbstraction<IGroupsRepository>("GroupsRepository");

export namespace GroupsRepository {
    export type Interface = IGroupsRepository;
    export type Error = RepositoryError;
}

/**
 * PluginGroupsProvider provides access to plugin-defined (code) groups.
 */
export interface IPluginGroupsProvider {
    getGroups(): Promise<CmsGroup[]>;
}

export const PluginGroupsProvider = createAbstraction<IPluginGroupsProvider>(
    "PluginGroupsProvider"
);

export namespace PluginGroupsProvider {
    export type Interface = IPluginGroupsProvider;
}

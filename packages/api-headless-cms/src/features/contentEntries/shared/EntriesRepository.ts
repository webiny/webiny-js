// @ts-nocheck
import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { EntriesRepository as RepositoryAbstraction } from "./abstractions.js";
import {
    EntryNotFoundError,
    EntryStorageError,
    EntryAlreadyPublishedError,
    EntryNotPublishedError,
    EntryInBinError,
    EntryNotInBinError
} from "~/domains/contentEntries/errors.js";
import type { CmsEntry, CmsEntryMeta, CmsEntryListParams, CmsModel } from "~/types/index.js";
import { StorageOperations } from "~/features/shared/abstractions.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import { entryFromStorageTransform, entryToStorageTransform } from "~/utils/entryStorage.js";
import { PluginsContainer } from "~/legacy/abstractions.js";
import { NotAuthorizedError } from "~/utils/errors.js";

/**
 * EntriesRepository implementation following CQS principle.
 * Provides access to database-stored entries with access control.
 * Note: Entries are only stored in database, no plugin entries exist.
 */
class EntriesRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private pluginsContainer: PluginsContainer.Interface,
        private storageOperations: StorageOperations.Interface,
        private accessControl: AccessControl.Interface
    ) {}

    async getById(
        model: CmsModel,
        id: string
    ): Promise<Result<CmsEntry, RepositoryAbstraction.Error>> {
        try {
            const [storageEntry] = await this.storageOperations.entries.getByIds(model, {
                ids: [id]
            });

            if (!storageEntry) {
                return Result.fail(new EntryNotFoundError(id));
            }

            // Apply access control
            const canAccess = await this.accessControl.canAccessEntry({
                model,
                entry: storageEntry
            });
            if (!canAccess) {
                return Result.fail(new EntryNotFoundError(id));
            }

            const entry = await entryFromStorageTransform(
                { plugins: this.pluginsContainer },
                model,
                storageEntry
            );

            return Result.ok(entry);
        } catch (error) {
            return Result.fail(new EntryStorageError(error as Error));
        }
    }

    async getLatestRevision(
        model: CmsModel,
        entryId: string
    ): Promise<Result<CmsEntry, RepositoryAbstraction.Error>> {
        try {
            const storageEntry = await this.storageOperations.entries.getLatestRevisionByEntryId(
                model,
                {
                    id: entryId
                }
            );

            if (!storageEntry) {
                return Result.fail(new EntryNotFoundError(entryId));
            }

            // Apply access control
            const canAccess = await this.accessControl.canAccessEntry({
                model,
                entry: storageEntry
            });

            if (!canAccess) {
                return Result.fail(new NotAuthorizedError());
            }

            const entry = await entryFromStorageTransform(
                { plugins: this.pluginsContainer },
                model,
                storageEntry
            );

            return Result.ok(entry);
        } catch (error) {
            return Result.fail(new EntryStorageError(error as Error));
        }
    }

    async getPublishedRevision(
        model: CmsModel,
        entryId: string
    ): Promise<Result<CmsEntry, RepositoryAbstraction.Error>> {
        try {
            const storageEntry = await this.storageOperations.entries.getPublishedRevisionByEntryId(
                model,
                {
                    id: entryId
                }
            );

            if (!storageEntry) {
                return Result.fail(new EntryNotFoundError(entryId));
            }

            // Apply access control
            const canAccess = await this.accessControl.canAccessEntry({
                model,
                entry: storageEntry
            });

            if (!canAccess) {
                return Result.fail(new NotAuthorizedError());
            }

            const entry = await entryFromStorageTransform(
                { plugins: this.pluginsContainer },
                model,
                storageEntry
            );

            return Result.ok(entry);
        } catch (error) {
            return Result.fail(new EntryStorageError(error as Error));
        }
    }

    async getPreviousRevision(
        model: CmsModel,
        entryId: string,
        version: number
    ): Promise<Result<CmsEntry, RepositoryAbstraction.Error>> {
        try {
            const storageEntry = await this.storageOperations.entries.getPreviousRevision(model, {
                entryId,
                version
            });

            if (!storageEntry) {
                return Result.fail(new EntryNotFoundError(entryId));
            }

            // Apply access control
            const canAccess = await this.accessControl.canAccessEntry({
                model,
                entry: storageEntry
            });

            if (!canAccess) {
                return Result.fail(new NotAuthorizedError());
            }

            const entry = await entryFromStorageTransform(
                { plugins: this.pluginsContainer },
                model,
                storageEntry
            );

            return Result.ok(entry);
        } catch (error) {
            return Result.fail(new EntryStorageError(error as Error));
        }
    }

    async list(
        model: CmsModel,
        params: CmsEntryListParams
    ): Promise<Result<[CmsEntry[], CmsEntryMeta], RepositoryAbstraction.Error>> {
        try {
            const { where: initialWhere, limit: initialLimit } = params || {};
            const limit = initialLimit && initialLimit > 0 ? initialLimit : 50;
            const where = { ...initialWhere };
            const listParams = { ...params, where, limit };

            const { hasMoreItems, totalCount, cursor, items } =
                await this.storageOperations.entries.list(model, listParams);

            // Apply access control to all entries
            const accessibleEntries: CmsEntry[] = [];
            for (const storageEntry of items) {
                const canAccess = await this.accessControl.canAccessEntry({
                    model,
                    entry: storageEntry
                });
                if (canAccess) {
                    const entry = await entryFromStorageTransform(
                        { plugins: this.pluginsContainer },
                        model,
                        storageEntry
                    );

                    accessibleEntries.push(entry);
                }
            }

            return Result.ok([accessibleEntries, { hasMoreItems, totalCount, cursor }]);
        } catch (error) {
            return Result.fail(new EntryStorageError(error as Error));
        }
    }

    async getRevisions(
        model: CmsModel,
        entryId: string
    ): Promise<Result<CmsEntry[], RepositoryAbstraction.Error>> {
        try {
            const revisions = await this.storageOperations.entries.getRevisions(model, {
                id: entryId
            });

            // Apply access control to all revisions
            const accessibleRevisions: CmsEntry[] = [];
            for (const storageEntry of revisions) {
                const canAccess = await this.accessControl.canAccessEntry({
                    model,
                    entry: storageEntry
                });

                if (canAccess) {
                    const entry = await entryFromStorageTransform(
                        { plugins: this.pluginsContainer },
                        model,
                        storageEntry
                    );

                    accessibleRevisions.push(entry);
                }
            }

            return Result.ok(accessibleRevisions);
        } catch (error) {
            return Result.fail(new EntryStorageError(error as Error));
        }
    }

    async getByIds(
        model: CmsModel,
        ids: string[]
    ): Promise<Result<CmsEntry[], RepositoryAbstraction.Error>> {
        try {
            const entries = await this.storageOperations.entries.getByIds(model, { ids });

            // Apply access control to all entries
            const accessibleEntries: CmsEntry[] = [];
            for (const storageEntry of entries) {
                const canAccess = await this.accessControl.canAccessEntry({
                    model,
                    entry: storageEntry
                });
                if (canAccess) {
                    const entry = await entryFromStorageTransform(
                        { plugins: this.pluginsContainer },
                        model,
                        storageEntry
                    );

                    accessibleEntries.push(entry);
                }
            }

            return Result.ok(accessibleEntries);
        } catch (error) {
            return Result.fail(new EntryStorageError(error as Error));
        }
    }

    async create(
        model: CmsModel,
        entry: CmsEntry
    ): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            const storageEntry = await entryToStorageTransform(
                { plugins: this.pluginsContainer },
                model,
                entry
            );

            await this.storageOperations.entries.create(model, { entry, storageEntry });
            return Result.ok();
        } catch (error) {
            return Result.fail(new EntryStorageError(error as Error));
        }
    }

    async createRevisionFrom(
        model: CmsModel,
        entry: CmsEntry
    ): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            const storageEntry = await entryToStorageTransform(
                { plugins: this.pluginsContainer },
                model,
                entry
            );
            await this.storageOperations.entries.createRevisionFrom(model, { entry, storageEntry });
            return Result.ok();
        } catch (error) {
            return Result.fail(new EntryStorageError(error as Error));
        }
    }

    async update(
        model: CmsModel,
        entry: CmsEntry
    ): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            // Verify entry exists
            const existingEntry = await this.storageOperations.entries.getRevisionById(model, {
                id: entry.id
            });

            if (!existingEntry) {
                return Result.fail(new EntryNotFoundError(entry.id));
            }

            const storageEntry = await entryToStorageTransform(
                { plugins: this.pluginsContainer },
                model,
                entry
            );

            await this.storageOperations.entries.update(model, { entry, storageEntry });
            return Result.ok();
        } catch (error) {
            return Result.fail(new EntryStorageError(error as Error));
        }
    }

    async delete(model: CmsModel, id: string): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            // Verify entry exists
            const entry = await this.storageOperations.entries.get(model, { id });
            if (!entry) {
                return Result.fail(new EntryNotFoundError(id));
            }

            await this.storageOperations.entries.delete(model, id);
            return Result.ok();
        } catch (error) {
            return Result.fail(new EntryStorageError(error as Error));
        }
    }

    async deleteRevision(
        model: CmsModel,
        id: string
    ): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            // Verify entry exists
            const entry = await this.storageOperations.entries.get(model, { id });
            if (!entry) {
                return Result.fail(new EntryNotFoundError(id));
            }

            await this.storageOperations.entries.deleteRevision(model, id);
            return Result.ok();
        } catch (error) {
            return Result.fail(new EntryStorageError(error as Error));
        }
    }

    async publish(model: CmsModel, id: string): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            // Verify entry exists
            const entry = await this.storageOperations.entries.getRevisionById(model, { id });
            if (!entry) {
                return Result.fail(new EntryNotFoundError(id));
            }

            // Check if already published
            if (entry.status === "published") {
                return Result.fail(new EntryAlreadyPublishedError(id));
            }

            await this.storageOperations.entries.publish(model, { entry });
            return Result.ok();
        } catch (error) {
            return Result.fail(new EntryStorageError(error as Error));
        }
    }

    async unpublish(
        model: CmsModel,
        id: string
    ): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            // Verify entry exists
            const entry = await this.storageOperations.entries.get(model, { id });
            if (!entry) {
                return Result.fail(new EntryNotFoundError(id));
            }

            // Check if not published
            if (entry.status !== "published") {
                return Result.fail(new EntryNotPublishedError(id));
            }

            await this.storageOperations.entries.unpublish(model, id);
            return Result.ok();
        } catch (error) {
            return Result.fail(new EntryStorageError(error as Error));
        }
    }

    async move(
        model: CmsModel,
        id: string,
        folderId: string
    ): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            // Verify entry exists
            const entry = await this.storageOperations.entries.get(model, { id });
            if (!entry) {
                return Result.fail(new EntryNotFoundError(id));
            }

            await this.storageOperations.entries.move(model, id, folderId);
            return Result.ok();
        } catch (error) {
            return Result.fail(new EntryStorageError(error as Error));
        }
    }

    async moveToBin(
        model: CmsModel,
        id: string
    ): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            // Verify entry exists
            const entry = await this.storageOperations.entries.get(model, { id });
            if (!entry) {
                return Result.fail(new EntryNotFoundError(id));
            }

            // Check if already in bin
            if (entry.wbyAco_location?.folderId === "bin") {
                return Result.fail(new EntryInBinError(id));
            }

            await this.storageOperations.entries.moveToBin(model, id);
            return Result.ok();
        } catch (error) {
            return Result.fail(new EntryStorageError(error as Error));
        }
    }

    async restoreFromBin(
        model: CmsModel,
        id: string
    ): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            // Verify entry exists
            const entry = await this.storageOperations.entries.get(model, { id });
            if (!entry) {
                return Result.fail(new EntryNotFoundError(id));
            }

            // Check if not in bin
            if (entry.wbyAco_location?.folderId !== "bin") {
                return Result.fail(new EntryNotInBinError(id));
            }

            await this.storageOperations.entries.restoreFromBin(model, id);
            return Result.ok();
        } catch (error) {
            return Result.fail(new EntryStorageError(error as Error));
        }
    }
}

export const EntriesRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: EntriesRepositoryImpl,
    dependencies: [PluginsContainer, StorageOperations, AccessControl]
});

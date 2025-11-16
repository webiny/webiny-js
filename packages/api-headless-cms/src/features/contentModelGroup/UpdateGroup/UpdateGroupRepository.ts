import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { UpdateGroupRepository as RepositoryAbstraction } from "./abstractions.js";
import { GroupCache } from "~/features/contentModelGroup/shared/abstractions.js";
import { PluginGroupsProvider } from "~/features/contentModelGroup/shared/abstractions.js";
import { GroupCannotUpdateCodeDefinedError } from "~/domain/contentModelGroup/errors.js";
import { GroupPersistenceError } from "~/domain/contentModelGroup/errors.js";
import { StorageOperations } from "~/features/shared/abstractions.js";
import type { CmsGroup } from "~/types/index.js";

/**
 * UpdateGroupRepository - Validates and persists group updates.
 *
 * Responsibilities:
 * - Check if group is plugin-based (cannot update)
 * - Persist updates to storage
 * - Clear GroupCache after successful update
 */
class UpdateGroupRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private groupCache: GroupCache.Interface,
        private pluginGroupsProvider: PluginGroupsProvider.Interface,
        private storageOperations: StorageOperations.Interface
    ) {}

    async execute(group: CmsGroup): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            // Check if this is a plugin-based group (cannot be updated)
            const pluginGroups = await this.pluginGroupsProvider.getGroups();
            const isPluginGroup = pluginGroups.some(pg => pg.slug === group.slug);

            if (isPluginGroup) {
                return Result.fail(new GroupCannotUpdateCodeDefinedError(group.id));
            }

            // Persist updates
            await this.storageOperations.groups.update({ group });

            // Clear cache
            this.groupCache.clear();

            return Result.ok();
        } catch (error) {
            return Result.fail(new GroupPersistenceError(error as Error));
        }
    }
}

export const UpdateGroupRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: UpdateGroupRepositoryImpl,
    dependencies: [GroupCache, PluginGroupsProvider, StorageOperations]
});

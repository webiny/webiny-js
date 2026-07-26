import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { DeleteGroupRepository as RepositoryAbstraction } from "./abstractions.js";
import { GroupCache } from "~/features/contentModelGroup/shared/abstractions.js";
import { PluginGroupsProvider } from "~/features/contentModelGroup/shared/abstractions.js";
import { GroupCannotDeleteCodeDefinedError } from "~/domain/contentModelGroup/errors.js";
import { GroupHasModelsError } from "~/domain/contentModelGroup/errors.js";
import { GroupPersistenceError } from "~/domain/contentModelGroup/errors.js";
import { GroupStorageOperations } from "~/features/shared/storageOperations/GroupStorageOperations.js";
import { ModelStorageOperations } from "~/features/shared/storageOperations/ModelStorageOperations.js";
import type { CmsGroup } from "~/types/index.js";

/**
 * DeleteGroupRepository - Validates and performs group deletion.
 *
 * Responsibilities:
 * - Check if group is plugin-based (cannot delete)
 * - Check if models reference this group (cannot delete)
 * - Persist deletion to storage
 * - Clear GroupCache after successful deletion
 */
class DeleteGroupRepositoryImpl implements RepositoryAbstraction.Interface {
    public constructor(
        private groupCache: GroupCache.Interface,
        private pluginGroupsProvider: PluginGroupsProvider.Interface,
        private groupStorageOperations: GroupStorageOperations.Interface,
        private modelStorageOperations: ModelStorageOperations.Interface
    ) {}

    async execute(group: CmsGroup): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            // Check if this is a plugin-based group (cannot be deleted)
            const pluginGroups = await this.pluginGroupsProvider.getGroups();
            const isPluginGroup = pluginGroups.some(pg => pg.slug === group.slug);

            if (isPluginGroup) {
                return Result.fail(new GroupCannotDeleteCodeDefinedError(group.id));
            }

            // Check if any models reference this group
            const models = await this.modelStorageOperations.list({
                where: {
                    tenant: group.tenant
                }
            });

            const items = models.filter(model => model.group === group.slug);
            if (items.length > 0) {
                return Result.fail(new GroupHasModelsError());
            }

            // Perform deletion
            await this.groupStorageOperations.delete({ group });

            // Clear cache
            this.groupCache.clear();

            return Result.ok();
        } catch (error) {
            return Result.fail(new GroupPersistenceError(error as Error));
        }
    }
}

export const DeleteGroupRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: DeleteGroupRepositoryImpl,
    dependencies: [GroupCache, PluginGroupsProvider, GroupStorageOperations, ModelStorageOperations]
});

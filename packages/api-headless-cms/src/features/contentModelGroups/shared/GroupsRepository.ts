import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { GroupsRepository as RepositoryAbstraction } from "./abstractions.js";
import { PluginGroupsProvider } from "./abstractions.js";
import {
    GroupNotFoundError,
    GroupStorageError,
    GroupCannotUpdateCodeDefinedError,
    GroupCannotDeleteCodeDefinedError
} from "~/domains/contentModelGroups/errors.js";
import type { CmsGroup } from "~/types/index.js";
import { StorageOperations } from "~/features/shared/abstractions.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import { TenantContext } from "@webiny/api-core/features/TenantContext";

/**
 * GroupsRepository implementation following CQS principle.
 * Provides unified access to both database-stored and plugin-defined groups.
 */
class GroupsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private tenantContext: TenantContext.Interface,
        private pluginGroupsProvider: PluginGroupsProvider.Interface,
        private accessControl: AccessControl.Interface,
        private storageOperations: StorageOperations.Interface
    ) {}

    async get(groupId: string): Promise<Result<CmsGroup, RepositoryAbstraction.Error>> {
        try {
            // 1. Check plugin groups first (code-defined, immutable)
            const pluginGroups = await this.pluginGroupsProvider.getGroups();
            const pluginGroup = pluginGroups.find(g => g.id === groupId);

            if (pluginGroup) {
                // Apply access control
                const canAccess = await this.accessControl.canAccessGroup({ group: pluginGroup });
                if (!canAccess) {
                    return Result.fail(new GroupNotFoundError(groupId));
                }
                return Result.ok(pluginGroup);
            }

            // 2. Query database groups
            const tenant = this.tenantContext.getTenant();
            const dbGroup = await this.storageOperations.groups.get({
                id: groupId,
                tenant: tenant.id
            });
            if (!dbGroup) {
                return Result.fail(new GroupNotFoundError(groupId));
            }

            // Apply access control
            const canAccess = await this.accessControl.canAccessGroup({ group: dbGroup });
            if (!canAccess) {
                return Result.fail(new GroupNotFoundError(groupId));
            }

            return Result.ok(dbGroup);
        } catch (error) {
            return Result.fail(new GroupStorageError(error as Error));
        }
    }

    async list(): Promise<Result<CmsGroup[], RepositoryAbstraction.Error>> {
        try {
            // 1. Get plugin groups
            const pluginGroups = await this.pluginGroupsProvider.getGroups();

            // 2. Get DB groups
            const tenant = this.tenantContext.getTenant();
            const dbGroups = await this.storageOperations.groups.list({
                where: { tenant: tenant.id }
            });

            // 3. Combine both sources
            const allGroups = [...pluginGroups, ...dbGroups];

            // 4. Apply access control to all groups
            const accessibleGroups: CmsGroup[] = [];
            for (const group of allGroups) {
                const canAccess = await this.accessControl.canAccessGroup({ group });
                if (canAccess) {
                    accessibleGroups.push(group);
                }
            }

            return Result.ok(accessibleGroups);
        } catch (error) {
            return Result.fail(new GroupStorageError(error as Error));
        }
    }

    async create(group: CmsGroup): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            // Only DB groups can be created (plugin groups are code-defined)
            await this.storageOperations.groups.create({ group });
            return Result.ok();
        } catch (error) {
            return Result.fail(new GroupStorageError(error as Error));
        }
    }

    async update(group: CmsGroup): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            // Cannot update plugin groups
            const pluginGroups = await this.pluginGroupsProvider.getGroups();
            const isPluginGroup = pluginGroups.some(g => g.id === group.id);

            if (isPluginGroup) {
                return Result.fail(new GroupCannotUpdateCodeDefinedError(group.id));
            }

            await this.storageOperations.groups.update({ group });
            return Result.ok();
        } catch (error) {
            return Result.fail(new GroupStorageError(error as Error));
        }
    }

    async delete(group: CmsGroup): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            // Cannot delete plugin groups
            const pluginGroups = await this.pluginGroupsProvider.getGroups();
            const isPluginGroup = pluginGroups.some(g => g.id === group.id);

            if (isPluginGroup) {
                return Result.fail(new GroupCannotDeleteCodeDefinedError(group.id));
            }

            await this.storageOperations.groups.delete({ group });
            return Result.ok();
        } catch (error) {
            return Result.fail(new GroupStorageError(error as Error));
        }
    }
}

export const GroupsRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: GroupsRepositoryImpl,
    dependencies: [TenantContext, PluginGroupsProvider, AccessControl, StorageOperations]
});

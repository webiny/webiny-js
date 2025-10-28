import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { TenantContext } from "~/features/tenancy/TenantContext/index.js";
import { GroupsRepository as RepositoryAbstraction } from "./abstractions.js";
import type { Group, GetGroupInput, ListGroupsInput } from "./types.js";
import { SecurityStorageOperations, GroupsProvider } from "~/features/security/shared/abstractions.js";
import { GroupNotFoundError, GroupStorageError } from "./errors.js";

class GroupsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private tenantContext: TenantContext.Interface,
        private storageOperations: SecurityStorageOperations.Interface,
        private groupsProvider: GroupsProvider.Interface
    ) {}

    async get(params: GetGroupInput): Promise<Result<Group, RepositoryAbstraction.Error>> {
        try {
            const tenant = this.tenantContext.getTenant();

            // First check plugin groups
            const pluginGroups = await this.groupsProvider();
            const pluginGroup = pluginGroups.find(g => {
                // Match by ID or slug
                if (params.id && g.id === params.id) {
                    return true;
                }

                if (params.slug && g.slug === params.slug) {
                    return true;
                }

                return false;
            });

            // Filter by tenant if group has one
            if (pluginGroup) {
                if (!pluginGroup.tenant || pluginGroup.tenant === tenant.id) {
                    return Result.ok(pluginGroup);
                }
            }

            // Then check storage
            const group = await this.storageOperations.getGroup({
                where: {
                    ...params,
                    tenant: tenant.id
                }
            });

            if (group) {
                return Result.ok(group);
            }

            return Result.fail(new GroupNotFoundError());
        } catch (error) {
            return Result.fail(new GroupStorageError(error));
        }
    }

    async list(params: ListGroupsInput): Promise<Result<Group[], RepositoryAbstraction.Error>> {
        try {
            const tenant = this.tenantContext.getTenant();

            // Get groups from storage
            const groupsFromDatabase = await this.storageOperations.listGroups({
                where: {
                    tenant: tenant.id,
                    ...params.where
                },
                sort: params.sort || ["createdOn_ASC"]
            });

            // Get groups from plugins
            const pluginGroups = await this.groupsProvider();
            const groupsFromPlugins = pluginGroups.filter(group => {
                // Filter by tenant - plugin groups with no tenant or matching tenant
                if (group.tenant && group.tenant !== tenant.id) {
                    return false;
                }

                // Apply where filters if provided
                const { id_in, slug_in } = params.where || {};
                if (id_in && !id_in.includes(group.id)) {
                    return false;
                }
                if (slug_in && !slug_in.includes(group.slug)) {
                    return false;
                }

                return true;
            });

            // Plugin groups come first (they don't have createdOn), then database groups
            return Result.ok([...groupsFromPlugins, ...groupsFromDatabase]);
        } catch (error) {
            return Result.fail(new GroupStorageError(error));
        }
    }

    async create(group: Group): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            await this.storageOperations.createGroup({ group });
            return Result.ok();
        } catch (error) {
            return Result.fail(new GroupStorageError(error));
        }
    }

    async update(group: Group): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            await this.storageOperations.updateGroup({ group });

            return Result.ok();
        } catch (error) {
            return Result.fail(new GroupStorageError(error));
        }
    }

    async delete(group: Group): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            await this.storageOperations.deleteGroup({ group });
            return Result.ok();
        } catch (error) {
            return Result.fail(new GroupStorageError(error));
        }
    }
}

export const GroupsRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: GroupsRepositoryImpl,
    dependencies: [TenantContext, SecurityStorageOperations, GroupsProvider]
});

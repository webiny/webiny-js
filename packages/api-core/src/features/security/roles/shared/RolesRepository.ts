import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { TenantContext } from "~/features/tenancy/TenantContext/index.js";
import { RolesRepository as RepositoryAbstraction } from "./abstractions.js";
import type { Role, GetRoleInput, ListRolesInput } from "./types.js";
import {
    SecurityStorageOperations,
    RolesProvider
} from "~/features/security/shared/abstractions.js";
import { RoleNotFoundError, RoleStorageError } from "./errors.js";

class RolesRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private tenantContext: TenantContext.Interface,
        private storageOperations: SecurityStorageOperations.Interface,
        private rolesProvider: RolesProvider.Interface
    ) {}

    async get(params: GetRoleInput): Promise<Result<Role, RepositoryAbstraction.Error>> {
        try {
            const tenant = this.tenantContext.getTenant();

            // First check plugin roles
            const pluginRoles = await this.rolesProvider();
            const pluginRole = pluginRoles.find(r => {
                // Match by ID or slug
                if (params.id && r.id === params.id) {
                    return true;
                }

                if (params.slug && r.slug === params.slug) {
                    return true;
                }

                return false;
            });

            // Filter by tenant if role has one
            if (pluginRole) {
                if (!pluginRole.tenant || pluginRole.tenant === tenant.id) {
                    return Result.ok(pluginRole);
                }
            }

            // Then check storage
            const role = await this.storageOperations.getRole({
                where: {
                    ...params,
                    tenant: tenant.id
                }
            });

            if (role) {
                return Result.ok(role);
            }

            return Result.fail(new RoleNotFoundError());
        } catch (error) {
            return Result.fail(new RoleStorageError(error));
        }
    }

    async list(params: ListRolesInput): Promise<Result<Role[], RepositoryAbstraction.Error>> {
        try {
            const tenant = this.tenantContext.getTenant();

            // Get roles from storage
            const rolesFromDatabase = await this.storageOperations.listRoles({
                where: {
                    tenant: tenant.id,
                    ...params.where
                },
                sort: params.sort || ["createdOn_ASC"]
            });

            // Get roles from plugins
            const pluginRoles = await this.rolesProvider();
            const rolesFromPlugins = pluginRoles.filter(role => {
                // Filter by tenant - plugin roles with no tenant or matching tenant
                if (role.tenant && role.tenant !== tenant.id) {
                    return false;
                }

                // Apply where filters if provided
                const { id_in, slug_in } = params.where || {};
                if (id_in && !id_in.includes(role.id)) {
                    return false;
                }
                if (slug_in && !slug_in.includes(role.slug)) {
                    return false;
                }

                return true;
            });

            // Plugin roles come first (they don't have createdOn), then database roles
            return Result.ok([...rolesFromPlugins, ...rolesFromDatabase]);
        } catch (error) {
            return Result.fail(new RoleStorageError(error));
        }
    }

    async create(role: Role): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            await this.storageOperations.createRole({ role });
            return Result.ok();
        } catch (error) {
            return Result.fail(new RoleStorageError(error));
        }
    }

    async update(role: Role): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            await this.storageOperations.updateRole({ role });
            return Result.ok();
        } catch (error) {
            return Result.fail(new RoleStorageError(error));
        }
    }

    async delete(role: Role): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            await this.storageOperations.deleteRole({ role });
            return Result.ok();
        } catch (error) {
            return Result.fail(new RoleStorageError(error));
        }
    }
}

export const RolesRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: RolesRepositoryImpl,
    dependencies: [TenantContext, SecurityStorageOperations, RolesProvider]
});

import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { GroupsRepository as RepositoryAbstraction } from "./abstractions.js";
import type { Group, GetGroupInput, ListGroupsInput } from "./types.js";
import { SecurityStorageOperations } from "~/features/shared/abstractions.js";
import { TenantContext } from "@webiny/api-tenancy/features/TenantContext";
import { GroupNotFoundError, GroupStorageError } from "./errors.js";

class GroupsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private tenantContext: TenantContext.Interface,
        private storageOperations: SecurityStorageOperations.Interface
    ) {}

    async get(params: GetGroupInput): Promise<Result<Group, RepositoryAbstraction.Error>> {
        try {
            const tenant = this.tenantContext.getTenant();
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
            const result = await this.storageOperations.listGroups({
                where: {
                    tenant: tenant.id,
                    ...params.where
                },
                sort: params.sort
            });
            return Result.ok(result);
        } catch (error) {
            return Result.fail(new GroupStorageError(error));
        }
    }

    async create(group: Group): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            await this.storageOperations.createGroup({ group });
            return Result.ok(void 0);
        } catch (error) {
            return Result.fail(new GroupStorageError(error));
        }
    }

    async update(group: Group): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            await this.storageOperations.updateGroup({ group });

            return Result.ok(void 0);
        } catch (error) {
            return Result.fail(new GroupStorageError(error));
        }
    }

    async delete(group: Group): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            await this.storageOperations.deleteGroup({ group });
            return Result.ok(void 0);
        } catch (error) {
            return Result.fail(new GroupStorageError(error));
        }
    }
}

export const GroupsRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: GroupsRepositoryImpl,
    dependencies: [TenantContext, SecurityStorageOperations]
});

import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { TenantContext } from "~/features/tenancy/TenantContext/index.js";
import { AdminUsersRepository as RepositoryAbstraction } from "./abstractions.js";
import { AdminUsersStorageOperations } from "./storageAbstractions.js";
import { createUserLoaders } from "./loaders.js";
import { UserNotFoundError, UserStorageError } from "./errors.js";
import type { AdminUser } from "./types.js";
import type {
    GetUserAcrossTenantsInput,
    GetUserInput,
    ListUserRecordsInput,
    ListUsersInput
} from "./types.js";

class AdminUsersRepositoryImpl implements RepositoryAbstraction.Interface {
    private loaders: ReturnType<typeof createUserLoaders>;

    constructor(
        private tenantContext: TenantContext.Interface,
        private storageOperations: AdminUsersStorageOperations.Interface
    ) {
        // Initialize DataLoaders using existing implementation
        this.loaders = createUserLoaders({
            getTenant: () => this.tenantContext.getTenant().id,
            storageOperations: this.storageOperations
        });
    }

    async get(params: GetUserInput): Promise<Result<AdminUser, RepositoryAbstraction.Error>> {
        try {
            const tenant = this.tenantContext.getTenant().id;

            // Use DataLoader for ID-based queries (majority of queries)
            if (params.id) {
                const user = await this.loaders.getUser.load({
                    tenant,
                    id: params.id
                });

                if (!user) {
                    return Result.fail(new UserNotFoundError(params.id));
                }

                return Result.ok(user);
            }

            // Direct query for email-based lookups (rare)
            if (params.email) {
                const user = await this.storageOperations.getUser({
                    where: { tenant: params.tenant ?? tenant, email: params.email }
                });

                if (!user) {
                    return Result.fail(new UserNotFoundError(params.email));
                }

                return Result.ok(user);
            }

            return Result.fail(new UserNotFoundError("unknown"));
        } catch (error) {
            return Result.fail(new UserStorageError(error as Error));
        }
    }

    async list(params: ListUsersInput): Promise<Result<AdminUser[], RepositoryAbstraction.Error>> {
        try {
            const tenant = this.tenantContext.getTenant().id;
            const users = await this.storageOperations.listUsers({
                where: { tenant, ...params.where },
                sort: params.sort || ["createdOn_ASC"]
            });

            return Result.ok(users);
        } catch (error) {
            return Result.fail(new UserStorageError(error as Error));
        }
    }

    async getUserAcrossTenants(
        params: GetUserAcrossTenantsInput
    ): Promise<Result<AdminUser[], RepositoryAbstraction.Error>> {
        try {
            const users = await this.storageOperations.getUserAcrossTenants(params);

            return Result.ok(users);
        } catch (error) {
            return Result.fail(new UserStorageError(error as Error));
        }
    }

    async listUserRecords(
        params: ListUserRecordsInput
    ): Promise<Result<AdminUser[], RepositoryAbstraction.Error>> {
        try {
            const users = await this.storageOperations.listUserRecords(params);

            return Result.ok(users);
        } catch (error) {
            return Result.fail(new UserStorageError(error as Error));
        }
    }

    async create(user: AdminUser): Promise<Result<AdminUser, RepositoryAbstraction.Error>> {
        try {
            const result = await this.storageOperations.createUser({ user });

            // Prime the cache with the new user
            const tenant = this.tenantContext.getTenant().id;
            const key = { tenant, id: result.id };
            this.loaders.getUser.clear(key).prime(key, result);

            return Result.ok(result);
        } catch (error) {
            return Result.fail(new UserStorageError(error as Error));
        }
    }

    async update(user: AdminUser): Promise<Result<AdminUser, RepositoryAbstraction.Error>> {
        try {
            await this.storageOperations.updateUser({ user });

            // Update the cache. The record can belong to another tenant than the current one.
            const key = { tenant: user.tenant, id: user.id };
            this.loaders.getUser.clear(key).prime(key, user);

            return Result.ok(user);
        } catch (error) {
            return Result.fail(new UserStorageError(error as Error));
        }
    }

    async delete(user: AdminUser): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            await this.storageOperations.deleteUser({ user });

            // Clear from cache
            this.clearCache([{ tenant: user.tenant, id: user.id }]);

            return Result.ok();
        } catch (error) {
            return Result.fail(new UserStorageError(error as Error));
        }
    }

    clearCache(keys: Array<{ tenant: string; id: string }>): void {
        this.loaders.clearLoadersCache(keys);
    }
}

export const AdminUsersRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: AdminUsersRepositoryImpl,
    dependencies: [TenantContext, AdminUsersStorageOperations]
});

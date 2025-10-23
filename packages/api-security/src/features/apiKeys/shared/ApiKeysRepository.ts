import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { ApiKeysRepository as RepositoryAbstraction } from "./abstractions.js";
import type { ApiKey, ListApiKeysInput } from "./types.js";
import { SecurityStorageOperations } from "~/features/shared/abstractions.js";
import { TenantContext } from "@webiny/api-tenancy/features/TenantContext";
import { ApiKeyNotFoundError, ApiKeyStorageError } from "./errors.js";

class ApiKeysRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private tenantContext: TenantContext.Interface,
        private storageOperations: SecurityStorageOperations.Interface
    ) {}

    async get(id: string): Promise<Result<ApiKey, RepositoryAbstraction.Error>> {
        try {
            const tenant = this.tenantContext.getTenant();
            const apiKey = await this.storageOperations.getApiKey({ id, tenant: tenant.id });
            if (apiKey) {
                return Result.ok(apiKey);
            }

            return Result.fail(new ApiKeyNotFoundError());
        } catch (error) {
            return Result.fail(error);
        }
    }

    async getByToken(token: string): Promise<Result<ApiKey, RepositoryAbstraction.Error>> {
        try {
            const tenant = this.tenantContext.getTenant();
            const apiKey = await this.storageOperations.getApiKeyByToken({
                token,
                tenant: tenant.id
            });

            if (apiKey) {
                return Result.ok(apiKey);
            }

            return Result.fail(new ApiKeyNotFoundError());
        } catch (error) {
            return Result.fail(new ApiKeyStorageError(error));
        }
    }

    async list(params: ListApiKeysInput): Promise<Result<ApiKey[], RepositoryAbstraction.Error>> {
        try {
            const tenant = this.tenantContext.getTenant();
            const result = await this.storageOperations.listApiKeys({
                where: { tenant: tenant.id },
                ...params
            });
            return Result.ok(result);
        } catch (error) {
            return Result.fail(new ApiKeyStorageError(error));
        }
    }

    async create(apiKey: ApiKey): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            await this.storageOperations.createApiKey({ apiKey });
            return Result.ok();
        } catch (error) {
            return Result.fail(new ApiKeyStorageError(error));
        }
    }

    async update(apiKey: ApiKey): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            await this.storageOperations.updateApiKey({ apiKey });

            return Result.ok();
        } catch (error) {
            return Result.fail(new ApiKeyStorageError(error));
        }
    }

    async delete(apiKey: ApiKey): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            await this.storageOperations.deleteApiKey({ apiKey });

            return Result.ok();
        } catch (error) {
            return Result.fail(new ApiKeyStorageError(error));
        }
    }
}

export const ApiKeysRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: ApiKeysRepositoryImpl,
    dependencies: [TenantContext, SecurityStorageOperations]
});

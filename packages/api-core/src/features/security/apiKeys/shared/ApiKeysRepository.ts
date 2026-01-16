import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { ApiKeysRepository as RepositoryAbstraction } from "./abstractions.js";
import { ApiKeyProvider } from "./abstractions.js";
import type { ApiKey, ListApiKeysInput } from "./types.js";
import { SecurityStorageOperations } from "~/features/security/shared/abstractions.js";
import { TenantContext } from "~/features/tenancy/TenantContext/index.js";
import { ApiKeyNotFoundError, ApiKeyPersistenceError, ApiKeyValidationError } from "./errors.js";

// TODO: create an ApiKeyMapper

class ApiKeysRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private tenantContext: TenantContext.Interface,
        private storageOperations: SecurityStorageOperations.Interface,
        private apiKeyProvider: ApiKeyProvider.Interface
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
            // First, check the database (database keys have priority over factory keys)
            const tenant = this.tenantContext.getTenant();
            const apiKey = await this.storageOperations.getApiKeyByToken({
                token,
                tenant: tenant.id
            });

            if (apiKey) {
                return Result.ok(apiKey);
            }

            // If not found in database, check if the API key is provided by a factory
            const factoryApiKey = await this.apiKeyProvider.getByToken(token);
            if (factoryApiKey) {
                return Result.ok(factoryApiKey);
            }

            return Result.fail(new ApiKeyNotFoundError());
        } catch (error) {
            return Result.fail(new ApiKeyPersistenceError(error));
        }
    }

    async getBySlug(slug: string): Promise<Result<ApiKey, RepositoryAbstraction.Error>> {
        try {
            // First, check the database (database keys have priority over factory keys)
            const tenant = this.tenantContext.getTenant();
            const apiKey = await this.storageOperations.getApiKeyBySlug({
                slug,
                tenant: tenant.id
            });

            if (apiKey) {
                return Result.ok(apiKey);
            }

            // If not found in database, check if the API key is provided by a factory
            const factoryApiKey = await this.apiKeyProvider.getBySlug(slug);
            if (factoryApiKey) {
                return Result.ok(factoryApiKey);
            }

            return Result.fail(new ApiKeyNotFoundError());
        } catch (error) {
            return Result.fail(new ApiKeyPersistenceError(error));
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
            return Result.fail(new ApiKeyPersistenceError(error));
        }
    }

    async create(apiKey: ApiKey): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            // Check if an API key with the same slug already exists
            const existingKeyResult = await this.getBySlug(apiKey.slug);

            // If we found a key, it's a duplicate slug - return validation error
            if (existingKeyResult.isOk()) {
                return Result.fail(
                    new ApiKeyValidationError(`API key with slug "${apiKey.slug}" already exists.`)
                );
            }

            // "NotFound" error is ok. Everything else is not ok.
            if (existingKeyResult.error.code !== "ApiKey/NotFound") {
                return Result.fail(existingKeyResult.error);
            }

            // Slug is unique, proceed with creation
            const tenant = this.tenantContext.getTenant();
            await this.storageOperations.createApiKey({ apiKey: { ...apiKey, tenant: tenant.id } });
            return Result.ok();
        } catch (error) {
            return Result.fail(new ApiKeyPersistenceError(error));
        }
    }

    async update(apiKey: ApiKey): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            const tenant = this.tenantContext.getTenant();
            await this.storageOperations.updateApiKey({ apiKey: { ...apiKey, tenant: tenant.id } });

            return Result.ok();
        } catch (error) {
            return Result.fail(new ApiKeyPersistenceError(error));
        }
    }

    async delete(apiKey: ApiKey): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            const tenant = this.tenantContext.getTenant();
            await this.storageOperations.deleteApiKey({ apiKey: { ...apiKey, tenant: tenant.id } });

            return Result.ok();
        } catch (error) {
            return Result.fail(new ApiKeyPersistenceError(error));
        }
    }
}

export const ApiKeysRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: ApiKeysRepositoryImpl,
    dependencies: [TenantContext, SecurityStorageOperations, ApiKeyProvider]
});

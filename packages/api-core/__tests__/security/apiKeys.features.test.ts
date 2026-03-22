import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { License } from "@webiny/wcp";
import { WcpContextFeature } from "~/features/wcp/WcpContext/index.js";
import { ApiCoreFeature } from "~/ApiCoreFeature.js";
import type { ApiCoreStorageOperations } from "~/types/core.js";
import { RootTenantValue } from "~/domain/tenancy/RootTenantValue.js";
import type { SecurityPermission } from "~/types/security.js";
import { Authorizer } from "~/features/security/authorization/Authorizer/index.js";
import { TenantContext } from "~/features/tenancy/TenantContext/index.js";
import { CreateApiKeyUseCase } from "~/features/security/apiKeys/CreateApiKey/index.js";
import { GetApiKeyBySlugUseCase } from "~/features/security/apiKeys/GetApiKeyBySlug/index.js";
import { GetApiKeyByTokenUseCase } from "~/features/security/apiKeys/GetApiKeyByToken/index.js";
import { ApiKeyFactory } from "~/features/security/apiKeys/shared/abstractions.js";
import type { CodeApiKey } from "~/features/security/apiKeys/shared/abstractions.js";

class TestAuthorizer implements Authorizer.Interface {
    async authorize(): Promise<SecurityPermission[] | null> {
        return [{ name: "*" }];
    }
}

class TestApiKeyFactory implements ApiKeyFactory.Interface {
    execute(): CodeApiKey[] {
        return [
            {
                name: "Factory API Key 1",
                slug: "factory-key-1",
                token: "wat_factory_token_1" as `wat_${string}`,
                permissions: [{ name: "content.view" }]
            },
            {
                name: "Factory API Key 2",
                slug: "factory-key-2",
                token: "wat_factory_token_2" as `wat_${string}`,
                permissions: [{ name: "admin" }]
            }
        ];
    }
}

describe("API Keys", function () {
    const setupBaseContainer = () => {
        // Create a new container for each test
        const container = new Container();

        const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
        const testLicense = License.fromLicenseDto(createTestWcpLicense());

        ApiCoreFeature.register(container, apiCoreStorage.storageOperations);
        WcpContextFeature.register(container, testLicense);
        container.registerInstance(Authorizer, new TestAuthorizer());

        const tenantContext = container.resolve(TenantContext);
        tenantContext.setTenant(RootTenantValue.create());

        return container;
    };

    const setupContainerWithApiKeys = () => {
        const container = setupBaseContainer();
        container.registerInstance(ApiKeyFactory, new TestApiKeyFactory());
        return container;
    };

    it("should create an API key", async () => {
        const container = setupContainerWithApiKeys();
        const createApiKey = container.resolve(CreateApiKeyUseCase);

        const result = await createApiKey.execute({
            name: "Test API Key",
            slug: "test-api-key",
            description: "A test API key",
            permissions: [{ name: "content.read" }, { name: "content.write" }]
        });

        expect(result.isOk()).toBe(true);
        expect(result.value).toMatchObject({
            id: expect.any(String),
            name: "Test API Key",
            slug: "test-api-key",
            description: "A test API key",
            token: expect.any(String),
            permissions: [{ name: "content.read" }, { name: "content.write" }],
            createdBy: expect.any(Object),
            createdOn: expect.any(String)
        });
        expect(result.value!.token).toMatch(/^wat_/);
    });

    it("should get API key by slug", async () => {
        const container = setupContainerWithApiKeys();
        const createApiKey = container.resolve(CreateApiKeyUseCase);
        const getApiKeyBySlug = container.resolve(GetApiKeyBySlugUseCase);

        // Create an API key
        const createResult = await createApiKey.execute({
            name: "Slug Test Key",
            slug: "slug-test-key",
            description: "Testing slug lookup",
            permissions: [{ name: "admin" }]
        });

        expect(createResult.isOk()).toBe(true);
        const createdKey = createResult.value!;

        // Get by slug
        const getResult = await getApiKeyBySlug.execute("slug-test-key");

        expect(getResult.isOk()).toBe(true);
        expect(getResult.value).toMatchObject({
            id: createdKey.id,
            name: "Slug Test Key",
            slug: "slug-test-key",
            description: "Testing slug lookup",
            permissions: [{ name: "admin" }]
        });
    });

    it("should get API key by token", async () => {
        const container = setupContainerWithApiKeys();
        const createApiKey = container.resolve(CreateApiKeyUseCase);
        const getApiKeyByToken = container.resolve(GetApiKeyByTokenUseCase);

        // Create an API key
        const createResult = await createApiKey.execute({
            name: "Token Test Key",
            slug: "token-test-key",
            description: "Testing token lookup",
            permissions: [{ name: "files.read" }]
        });

        expect(createResult.isOk()).toBe(true);
        const createdKey = createResult.value!;

        // Get by token
        const getResult = await getApiKeyByToken.execute(createdKey.token);

        expect(getResult.isOk()).toBe(true);
        expect(getResult.value).toMatchObject({
            id: createdKey.id,
            name: "Token Test Key",
            slug: "token-test-key",
            token: createdKey.token,
            permissions: [{ name: "files.read" }]
        });
    });

    it("should return error when getting non-existent API key by slug", async () => {
        const container = setupContainerWithApiKeys();
        const getApiKeyBySlug = container.resolve(GetApiKeyBySlugUseCase);

        const result = await getApiKeyBySlug.execute("non-existent-slug");

        expect(result.isFail()).toBe(true);
        expect(result.error?.code).toBe("ApiKey/NotFound");
    });

    it("should return error when getting non-existent API key by token", async () => {
        const container = setupContainerWithApiKeys();
        const getApiKeyByToken = container.resolve(GetApiKeyByTokenUseCase);

        const result = await getApiKeyByToken.execute("wat_non_existent_token");

        expect(result.isFail()).toBe(true);
        expect(result.error?.code).toBe("ApiKey/NotFound");
    });

    it("should get factory API key by slug", async () => {
        const container = setupContainerWithApiKeys();
        const getApiKeyBySlug = container.resolve(GetApiKeyBySlugUseCase);

        const result = await getApiKeyBySlug.execute("factory-key-1");

        expect(result.isOk()).toBe(true);
        expect(result.value).toMatchObject({
            name: "Factory API Key 1",
            slug: "factory-key-1",
            token: "wat_factory_token_1",
            permissions: [{ name: "content.view" }]
        });
    });

    it("should get factory API key by token", async () => {
        const container = setupContainerWithApiKeys();
        const getApiKeyByToken = container.resolve(GetApiKeyByTokenUseCase);

        const result = await getApiKeyByToken.execute("wat_factory_token_2");

        expect(result.isOk()).toBe(true);
        expect(result.value).toMatchObject({
            name: "Factory API Key 2",
            slug: "factory-key-2",
            token: "wat_factory_token_2",
            permissions: [{ name: "admin" }]
        });
    });

    it("should prevent creating API key with duplicate slug from database", async () => {
        const container = setupBaseContainer();
        const createApiKey = container.resolve(CreateApiKeyUseCase);

        // Create first API key
        const createResult1 = await createApiKey.execute({
            name: "First Key",
            slug: "duplicate-slug",
            description: "First key",
            permissions: [{ name: "content.read" }]
        });

        expect(createResult1.isOk()).toBe(true);

        // Try to create another API key with the same slug
        const createResult2 = await createApiKey.execute({
            name: "Second Key",
            slug: "duplicate-slug",
            description: "Second key",
            permissions: [{ name: "content.write" }]
        });

        expect(createResult2.isFail()).toBe(true);
        expect(createResult2.error?.code).toBe("ApiKey/Validation");
    });

    it("should prevent creating API key with duplicate slug from factory", async () => {
        const container = setupContainerWithApiKeys();
        const createApiKey = container.resolve(CreateApiKeyUseCase);

        // Try to create API key with same slug as factory key
        const createResult = await createApiKey.execute({
            name: "Conflicting Key",
            slug: "factory-key-1",
            description: "This should fail",
            permissions: [{ name: "content.read" }]
        });

        expect(createResult.isFail()).toBe(true);
        expect(createResult.error?.code).toBe("ApiKey/Validation");
    });

    it("should allow database API key to override factory key when DB key exists first", async () => {
        // Setup: Create DB key WITHOUT factory registered yet
        const container = setupBaseContainer();

        const createApiKey = container.resolve(CreateApiKeyUseCase);

        // Create a database API key first
        const createResult = await createApiKey.execute({
            name: "Database Key First",
            slug: "factory-key-1",
            description: "Created before factory was registered",
            permissions: [{ name: "db.priority" }]
        });

        expect(createResult.isOk()).toBe(true);

        // Now register the factory with the same slug
        const container2 = setupContainerWithApiKeys();

        const getApiKeyBySlug = container2.resolve(GetApiKeyBySlugUseCase);

        // Get by slug - should return the database key, not the factory key
        const getResult = await getApiKeyBySlug.execute("factory-key-1");

        expect(getResult.isOk()).toBe(true);
        expect(getResult.value).toMatchObject({
            name: "Database Key First",
            slug: "factory-key-1",
            description: "Created before factory was registered",
            permissions: [{ name: "db.priority" }]
        });
    });

    it("should prevent UI user from creating key with same slug as factory key", async () => {
        const container = setupContainerWithApiKeys();
        // Factory is already registered (default beforeEach setup)
        const createApiKey = container.resolve(CreateApiKeyUseCase);

        // Try to create database key with same slug as existing factory key
        const createResult = await createApiKey.execute({
            name: "User Trying to Create",
            slug: "factory-key-1",
            description: "This should fail because factory key exists",
            permissions: [{ name: "content.read" }]
        });

        expect(createResult.isFail()).toBe(true);
        expect(createResult.error?.code).toBe("ApiKey/Validation");
    });
});

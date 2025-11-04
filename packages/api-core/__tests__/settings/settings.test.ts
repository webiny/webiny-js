import { describe, it, expect, beforeEach } from "vitest";
import { Container, createImplementation } from "@webiny/di";
import { SettingsDomain } from "~/domain/settings/feature.js";
import { SettingsFeature } from "~/features/settings/feature.js";
import { GetSettings } from "~/features/settings/GetSettings/index.js";
import { UpdateSettings } from "~/features/settings/UpdateSettings/index.js";
import { DeleteSettings } from "~/features/settings/DeleteSettings/index.js";
import { SettingsStorageOperations } from "~/features/settings/shared/abstractions.js";
import type {
    SettingsStorageRecord,
    IGetSettingsStorageParams,
    IUpdateSettingsStorageParams,
    IDeleteSettingsStorageParams
} from "~/features/settings/shared/types.js";
import { TenantContext } from "~/features/tenancy/TenantContext/index.js";
import { TenancyFeature } from "~/features/tenancy/TenancyFeature.js";
import type {
    Tenant,
    TenancyStorageOperations as ITenancyStorageOperations
} from "~/types/tenancy.js";
import { EventPublisherFeature } from "~/features/eventPublisher/feature.js";
import {
    SettingsBeforeUpdateHandler,
    SettingsAfterUpdateHandler
} from "~/features/settings/UpdateSettings/index.js";
import {
    SettingsBeforeDeleteHandler,
    SettingsAfterDeleteHandler
} from "~/features/settings/DeleteSettings/index.js";
import type { IEventHandler } from "~/features/eventPublisher/abstractions.js";
import type {
    SettingsBeforeUpdateEvent,
    SettingsAfterUpdateEvent
} from "~/features/settings/UpdateSettings/events.js";
import type {
    SettingsBeforeDeleteEvent,
    SettingsAfterDeleteEvent
} from "~/features/settings/DeleteSettings/events.js";

const createTenant = (input: Pick<Tenant, "id" | "name" | "parent">): Tenant => {
    return {
        ...input,
        isInstalled: true,
        createdOn: new Date().toISOString(),
        description: "Root tenant",
        settings: {},
        tags: [],
        status: "active",
        savedOn: new Date().toISOString()
    };
};

// ============================================================================
// Mock Storage Operations
// ============================================================================

class MockSettingsStorageOperations implements SettingsStorageOperations.Interface {
    private store = new Map<string, SettingsStorageRecord>();

    async getSettings(params: IGetSettingsStorageParams): Promise<SettingsStorageRecord | null> {
        const key = `${params.tenant}:${params.name}`;
        return this.store.get(key) || null;
    }

    async updateSettings(params: IUpdateSettingsStorageParams): Promise<void> {
        const key = `${params.tenant}:${params.name}`;
        this.store.set(key, {
            name: params.name,
            data: params.data,
            tenant: params.tenant
        });
    }

    async deleteSettings(params: IDeleteSettingsStorageParams): Promise<void> {
        const key = `${params.tenant}:${params.name}`;
        this.store.delete(key);
    }

    // Test helper methods
    clear() {
        this.store.clear();
    }

    seed(tenant: string, name: string, data: Record<string, any>) {
        const key = `${tenant}:${name}`;
        this.store.set(key, { name, data, tenant });
    }
}

// ============================================================================
// Mock Tenancy Storage Operations
// ============================================================================

class MockTenancyStorageOperations implements ITenancyStorageOperations {
    private tenants = new Map<string, Tenant>();

    constructor() {
        // Seed root tenant
        this.tenants.set(
            "root",
            createTenant({
                id: "root",
                name: "Root Tenant",
                parent: null
            })
        );
    }

    async getTenantById(id: string): Promise<Tenant | null> {
        return this.tenants.get(id) || null;
    }

    async getTenantsByIds(ids: readonly string[]): Promise<Tenant[]> {
        return ids.map(id => this.tenants.get(id)!);
    }

    async listTenants(): Promise<Tenant[]> {
        return Array.from(this.tenants.values());
    }

    async createTenant(tenant: Tenant): Promise<Tenant> {
        this.tenants.set(tenant.id, tenant);
        return tenant;
    }

    async updateTenant(tenant: Tenant): Promise<Tenant> {
        this.tenants.set(tenant.id, tenant);
        return tenant;
    }

    async deleteTenant(id: string): Promise<void> {
        this.tenants.delete(id);
    }
}

// ============================================================================
// Event Handlers
// ============================================================================

class TestBeforeUpdateHandler implements IEventHandler<SettingsBeforeUpdateEvent> {
    public events: SettingsBeforeUpdateEvent[] = [];

    async handle(event: SettingsBeforeUpdateEvent): Promise<void> {
        this.events.push(event);
    }
}

const TestBeforeUpdateHandlerImpl = createImplementation({
    abstraction: SettingsBeforeUpdateHandler,
    implementation: TestBeforeUpdateHandler,
    dependencies: []
});

class TestAfterUpdateHandler implements IEventHandler<SettingsAfterUpdateEvent> {
    public events: SettingsAfterUpdateEvent[] = [];

    async handle(event: SettingsAfterUpdateEvent): Promise<void> {
        this.events.push(event);
    }
}

const TestAfterUpdateHandlerImpl = createImplementation({
    abstraction: SettingsAfterUpdateHandler,
    implementation: TestAfterUpdateHandler,
    dependencies: []
});

// ============================================================================
// Tests
// ============================================================================

describe("Settings Feature", () => {
    let container: Container;
    let mockStorage: MockSettingsStorageOperations;
    let tenantContext: TenantContext.Interface;
    let getSettings: GetSettings.Interface;
    let updateSettings: UpdateSettings.Interface;
    let deleteSettings: DeleteSettings.Interface;

    beforeEach(() => {
        container = new Container();

        // Create mocks
        mockStorage = new MockSettingsStorageOperations();
        const mockTenancyStorage = new MockTenancyStorageOperations();

        // Register domain models
        SettingsDomain.register(container);

        // Register real TenancyFeature with mock storage
        TenancyFeature.register(container, mockTenancyStorage);

        // Register EventPublisher
        EventPublisherFeature.register(container);

        // Register Settings feature
        SettingsFeature.register(container, mockStorage);

        // Resolve services
        tenantContext = container.resolve(TenantContext);
        getSettings = container.resolve(GetSettings);
        updateSettings = container.resolve(UpdateSettings);
        deleteSettings = container.resolve(DeleteSettings);

        // Set initial tenant
        tenantContext.setTenant(createTenant({ id: "root", name: "Root Tenant", parent: null }));
    });

    describe("GetSettings", () => {
        it("should get settings successfully", async () => {
            // Seed data
            mockStorage.seed("root", "app-config", { theme: "dark", language: "en" });

            // Execute
            const result = await getSettings.execute("app-config");

            // Assert
            expect(result.isOk()).toBe(true);
            expect(result.value.toData()).toEqual({
                name: "app-config",
                data: { theme: "dark", language: "en" }
            });
        });

        it("should return error when settings not found", async () => {
            // Execute
            const result = await getSettings.execute("non-existent");

            // Assert
            expect(result.isFail()).toBe(true);
            expect(result.error.code).toBe("SETTINGS_NOT_FOUND");
        });

        it("should respect tenant isolation", async () => {
            // Seed data for different tenants
            mockStorage.seed("root", "app-config", { theme: "dark" });
            mockStorage.seed("tenant-123", "app-config", { theme: "light" });

            // Get settings for root tenant
            const result1 = await getSettings.execute("app-config");
            expect(result1.value?.data).toEqual({ theme: "dark" });

            // Switch to different tenant
            tenantContext.setTenant(
                createTenant({ id: "tenant-123", name: "Tenant 123", parent: "root" })
            );

            // Get settings for tenant-123
            const result2 = await getSettings.execute("app-config");
            expect(result2.value?.data).toEqual({ theme: "light" });
        });

        it("should not expose tenant in returned settings", async () => {
            // Seed data
            mockStorage.seed("root", "app-config", { theme: "dark" });

            // Execute
            const result = await getSettings.execute("app-config");

            // Assert - tenant should not be in the domain model
            expect(result.value).not.toHaveProperty("tenant");
            expect(result.value.toData()).toEqual({
                name: "app-config",
                data: { theme: "dark" }
            });
        });
    });

    describe("UpdateSettings", () => {
        it("should create new settings successfully", async () => {
            // Execute
            const result = await updateSettings.execute({
                name: "app-config",
                data: { theme: "dark", language: "en" }
            });

            // Assert
            expect(result.isOk()).toBe(true);
            expect(result.value.toData()).toEqual({
                name: "app-config",
                data: { theme: "dark", language: "en" }
            });

            // Verify it was stored
            const getResult = await getSettings.execute("app-config");
            expect(getResult.value?.data).toEqual({ theme: "dark", language: "en" });
        });

        it("should update existing settings", async () => {
            // Seed initial data
            mockStorage.seed("root", "app-config", { theme: "light" });

            // Update
            const result = await updateSettings.execute({
                name: "app-config",
                data: { theme: "dark", language: "es" }
            });

            // Assert
            expect(result.isOk()).toBe(true);
            expect(result.value?.data).toEqual({ theme: "dark", language: "es" });

            // Verify it was updated
            const getResult = await getSettings.execute("app-config");
            expect(getResult.value?.data).toEqual({ theme: "dark", language: "es" });
        });

        it("should validate settings name is required", async () => {
            // Execute with empty name
            const result = await updateSettings.execute({
                name: "",
                data: { theme: "dark" }
            });

            // Assert
            expect(result.isFail()).toBe(true);
            expect(result.error.code).toBe("SETTINGS_VALIDATION_ERROR");
            expect(result.error.message).toContain("name is required");
        });

        it("should validate settings data is an object", async () => {
            // Execute with invalid data
            const result = await updateSettings.execute({
                name: "app-config",
                data: null as any
            });

            // Assert
            expect(result.isFail()).toBe(true);
            expect(result.error.code).toBe("SETTINGS_VALIDATION_ERROR");
            expect(result.error.message).toContain("must be an object");
        });

        it("should respect tenant isolation", async () => {
            // Create settings for root tenant
            await updateSettings.execute({
                name: "app-config",
                data: { theme: "dark" }
            });

            // Switch tenant
            tenantContext.setTenant(
                createTenant({ id: "tenant-123", name: "Tenant 123", parent: "root" })
            );

            // Create settings for tenant-123
            await updateSettings.execute({
                name: "app-config",
                data: { theme: "light" }
            });

            // Verify both exist independently
            const result1 = await getSettings.execute("app-config");
            expect(result1.value?.data).toEqual({ theme: "light" });

            // Switch back to root
            tenantContext.setTenant(
                createTenant({ id: "root", name: "Root Tenant", parent: null })
            );
            const result2 = await getSettings.execute("app-config");
            expect(result2.value?.data).toEqual({ theme: "dark" });
        });
    });

    describe("Event Publishing", () => {
        let beforeHandler: TestBeforeUpdateHandler;
        let afterHandler: TestAfterUpdateHandler;

        beforeEach(() => {
            // Register event handlers
            container.register(TestBeforeUpdateHandlerImpl).inSingletonScope();
            container.register(TestAfterUpdateHandlerImpl).inSingletonScope();

            // Get handler instances
            beforeHandler = container.resolve(
                SettingsBeforeUpdateHandler
            ) as TestBeforeUpdateHandler;
            afterHandler = container.resolve(SettingsAfterUpdateHandler) as TestAfterUpdateHandler;
        });

        it("should publish before and after update events", async () => {
            // Execute
            await updateSettings.execute({
                name: "app-config",
                data: { theme: "dark" }
            });

            // Assert before event
            expect(beforeHandler.events).toHaveLength(1);
            expect(beforeHandler.events[0].eventType).toBe("settings.beforeUpdate");
            expect(beforeHandler.events[0].payload.input).toEqual({ theme: "dark" });

            // Assert after event
            expect(afterHandler.events).toHaveLength(1);
            expect(afterHandler.events[0].eventType).toBe("settings.afterUpdate");
            expect(afterHandler.events[0].payload.settings.data).toEqual({ theme: "dark" });
        });

        it("should not publish after event if update fails", async () => {
            // Execute with invalid data
            await updateSettings.execute({
                name: "",
                data: { theme: "dark" }
            });

            // Assert - no events should be published on validation failure
            expect(beforeHandler.events).toHaveLength(0);
            expect(afterHandler.events).toHaveLength(0);
        });

        it("should allow multiple handlers for the same event", async () => {
            // Register another handler
            class AnotherAfterUpdateHandler implements IEventHandler<SettingsAfterUpdateEvent> {
                public events: SettingsAfterUpdateEvent[] = [];

                async handle(event: SettingsAfterUpdateEvent): Promise<void> {
                    this.events.push(event);
                }
            }

            const AnotherAfterUpdateHandlerImpl = createImplementation({
                abstraction: SettingsAfterUpdateHandler,
                implementation: AnotherAfterUpdateHandler,
                dependencies: []
            });

            container.register(AnotherAfterUpdateHandlerImpl).inSingletonScope();

            const anotherHandler = container.resolveAll(SettingsAfterUpdateHandler)[1];

            // Execute
            await updateSettings.execute({
                name: "app-config",
                data: { theme: "dark" }
            });

            // Assert - both handlers received the event
            expect(afterHandler.events).toHaveLength(1);
            expect((anotherHandler as AnotherAfterUpdateHandler).events).toHaveLength(1);
        });
    });

    describe("Error Handling", () => {
        it("should handle storage errors gracefully", async () => {
            // Create a failing storage operation
            const failingStorage: SettingsStorageOperations.Interface = {
                getSettings: async () => {
                    throw new Error("Storage connection failed");
                },
                updateSettings: async () => {
                    throw new Error("Storage connection failed");
                },
                deleteSettings: async () => {
                    throw new Error("Storage connection failed");
                }
            };

            // Create new container with failing storage
            const failingContainer = new Container();
            const mockTenancyStorage = new MockTenancyStorageOperations();
            TenancyFeature.register(failingContainer, mockTenancyStorage);
            EventPublisherFeature.register(failingContainer);
            SettingsFeature.register(failingContainer, failingStorage);
            SettingsDomain.register(failingContainer);

            const failingTenantContext = failingContainer.resolve(TenantContext);
            failingTenantContext.setTenant(
                createTenant({ id: "root", name: "Root Tenant", parent: null })
            );

            const getSettingsWithFailure = failingContainer.resolve(GetSettings);
            const updateSettingsWithFailure = failingContainer.resolve(UpdateSettings);

            // Test get error
            const getResult = await getSettingsWithFailure.execute("test");
            expect(getResult.isFail()).toBe(true);
            expect(getResult.error.code).toBe("SETTINGS_STORAGE_ERROR");

            // Test update error
            const updateResult = await updateSettingsWithFailure.execute({
                name: "test",
                data: { value: "test" }
            });
            expect(updateResult.isFail()).toBe(true);
            expect(updateResult.error.code).toBe("SETTINGS_STORAGE_ERROR");
        });
    });

    describe("Integration", () => {
        it("should support full CRUD workflow", async () => {
            // Create
            const createResult = await updateSettings.execute({
                name: "user-preferences",
                data: { notifications: true, theme: "dark" }
            });
            expect(createResult.isOk()).toBe(true);

            // Read
            const readResult = await getSettings.execute("user-preferences");
            expect(readResult.value?.data).toEqual({ notifications: true, theme: "dark" });

            // Update
            const updateResult = await updateSettings.execute({
                name: "user-preferences",
                data: { notifications: false, theme: "light", language: "en" }
            });
            expect(updateResult.isOk()).toBe(true);

            // Read again to verify update
            const readAfterUpdate = await getSettings.execute("user-preferences");
            expect(readAfterUpdate.value?.data).toEqual({
                notifications: false,
                theme: "light",
                language: "en"
            });
        });
    });

    describe("DeleteSettings", () => {
        it("should delete settings successfully", async () => {
            // Seed data
            mockStorage.seed("root", "app-config", { theme: "dark" });

            // Delete
            const result = await deleteSettings.execute("app-config");

            // Assert
            expect(result.isOk()).toBe(true);

            // Verify it was deleted
            const getResult = await getSettings.execute("app-config");
            expect(getResult.isFail()).toBe(true);
            expect(getResult.error.code).toBe("SETTINGS_NOT_FOUND");
        });

        it("should return error when deleting non-existent settings", async () => {
            // Try to delete non-existent settings
            const result = await deleteSettings.execute("non-existent");

            // Assert
            expect(result.isFail()).toBe(true);
            expect(result.error.code).toBe("SETTINGS_NOT_FOUND");
        });

        it("should respect tenant isolation when deleting", async () => {
            // Seed data for different tenants
            mockStorage.seed("root", "app-config", { theme: "dark" });
            mockStorage.seed("tenant-123", "app-config", { theme: "light" });

            // Delete for root tenant
            const result = await deleteSettings.execute("app-config");
            expect(result.isOk()).toBe(true);

            // Verify root tenant settings deleted
            const getRoot = await getSettings.execute("app-config");
            expect(getRoot.isFail()).toBe(true);

            // Switch to tenant-123
            tenantContext.setTenant(
                createTenant({ id: "tenant-123", name: "Tenant 123", parent: "root" })
            );

            // Verify tenant-123 settings still exist
            const getTenant = await getSettings.execute("app-config");
            expect(getTenant.isOk()).toBe(true);
            expect(getTenant.value?.data).toEqual({ theme: "light" });
        });

        it("should publish before and after delete events", async () => {
            // Seed data
            mockStorage.seed("root", "app-config", { theme: "dark" });

            // Register event handlers
            const beforeHandler = new (class implements IEventHandler<SettingsBeforeDeleteEvent> {
                public events: SettingsBeforeDeleteEvent[] = [];
                async handle(event: SettingsBeforeDeleteEvent): Promise<void> {
                    this.events.push(event);
                }
            })();

            const afterHandler = new (class implements IEventHandler<SettingsAfterDeleteEvent> {
                public events: SettingsAfterDeleteEvent[] = [];
                async handle(event: SettingsAfterDeleteEvent): Promise<void> {
                    this.events.push(event);
                }
            })();

            container.registerInstance(SettingsBeforeDeleteHandler, beforeHandler);
            container.registerInstance(SettingsAfterDeleteHandler, afterHandler);

            // Delete settings
            await deleteSettings.execute("app-config");

            // Assert before event
            expect(beforeHandler.events).toHaveLength(1);
            expect(beforeHandler.events[0].eventType).toBe("settings.beforeDelete");
            expect(beforeHandler.events[0].payload.settings.name).toBe("app-config");

            // Assert after event
            expect(afterHandler.events).toHaveLength(1);
            expect(afterHandler.events[0].eventType).toBe("settings.afterDelete");
            expect(afterHandler.events[0].payload.settings.name).toBe("app-config");
        });
    });
});

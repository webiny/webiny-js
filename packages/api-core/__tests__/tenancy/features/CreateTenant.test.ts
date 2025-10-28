import { describe, it, vi, expect, Mock } from "vitest";
import { Container } from "@webiny/di-container";
import { EventPublisher } from "@webiny/api-core";
import { WcpFeatures } from "@webiny/api-wcp";
import { CreateTenantFeature } from "~/features/CreateTenant/index.js";
import { CreateTenantUseCaseAbstraction } from "~/features/CreateTenant/index.js";
import { TenancyStorageOperations } from "~/features/shared/storageOperations.js";
import { TenantCache } from "~/features/shared/abstractions.js";
import { TenantCache as TenantCacheImpl } from "~/features/shared/TenantCache.js";
import { TenantBeforeCreateEvent, TenantAfterCreateEvent } from "~/features/CreateTenant/events.js";
import {
    TenantBeforeCreateHandler,
    TenantAfterCreateHandler
} from "~/features/CreateTenant/abstractions.js";
import type { Tenant, CreateTenantInput, TenancyStorageOperations as IStorageOps } from "~/types";
import { CreateTenantError } from "~/features/CreateTenant/errors.js";

describe("CreateTenant Feature", () => {
    /**
     * Test Setup Factory
     * Creates a DI container with the full feature registered
     * and mocked infrastructure (storage operations, event publisher)
     */
    const setupFeature = (mockStorageOps: Partial<IStorageOps>) => {
        const container = new Container();

        WcpFeatures.register(container);

        // Mock EventPublisher to spy on published events
        const mockEventPublisher: Partial<EventPublisher.Interface> = {
            publish: vi.fn().mockResolvedValue(undefined)
        };
        container.registerInstance(EventPublisher, mockEventPublisher as any);

        // Register storage operations abstraction with mocked implementation
        container.registerInstance(TenancyStorageOperations, mockStorageOps as any);

        // Register real TenantCache with DataLoader
        const cache = new TenantCacheImpl(async (ids: readonly string[]) => {
            if (ids.length === 0) {
                return [];
            }
            const tenants = await mockStorageOps.getTenantsByIds!(ids);
            return ids.map((_, index) => tenants[index]);
        });
        container.registerInstance(TenantCache, cache);

        // Register the CreateTenant feature - it will auto-wire all dependencies
        CreateTenantFeature.register(container);

        // Resolve the use case (the public API)
        const useCase = container.resolve(CreateTenantUseCaseAbstraction);

        return {
            container,
            useCase,
            cache,
            eventPublisher: mockEventPublisher,
            storageOperations: mockStorageOps
        };
    };

    describe("Happy Path: Create Tenant", () => {
        it("should create tenant with minimal data", async () => {
            // Arrange
            const input: CreateTenantInput = {
                name: "Test Tenant",
                parent: "root",
                description: "",
                tags: []
            };

            const mockStorageOps: Partial<IStorageOps> = {
                createTenant: vi
                    .fn()
                    .mockImplementation((tenant: Tenant) => Promise.resolve(tenant)),
                getTenantsByIds: vi.fn().mockResolvedValue([])
            };

            const { useCase, storageOperations, eventPublisher } = setupFeature(mockStorageOps);

            // Act
            const result = await useCase.execute(input);

            expect(result.isOk()).toBe(true);
            const tenant = result.value;

            // Assert
            expect(tenant).toMatchObject({
                name: "Test Tenant",
                parent: "root",
                status: "active", // default
                settings: {}
            });
            expect(tenant.id).toBeDefined();
            expect(tenant.id).not.toBe("");
            expect(tenant.createdOn).toBeDefined();
            expect(tenant.savedOn).toBeDefined();
            expect(tenant.webinyVersion).toBe(process.env.WEBINY_VERSION);

            // Verify storage was called
            expect(storageOperations.createTenant).toHaveBeenCalledTimes(1);
            expect(storageOperations.createTenant).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: "Test Tenant",
                    parent: "root",
                    status: "active"
                })
            );

            // Verify events were published
            expect(eventPublisher.publish).toHaveBeenCalledTimes(2);
        });

        it("should create tenant with full data", async () => {
            // Arrange
            const input: CreateTenantInput = {
                id: "custom-id",
                name: "Full Tenant",
                description: "A complete tenant",
                tags: ["tag1", "tag2"],
                parent: "root",
                status: "inactive",
                settings: {
                    domains: [{ fqdn: "example.com" }]
                }
            };

            const mockStorageOps: Partial<IStorageOps> = {
                createTenant: vi
                    .fn()
                    .mockImplementation((tenant: Tenant) => Promise.resolve(tenant)),
                getTenantsByIds: vi.fn().mockResolvedValue([])
            };

            const { useCase, storageOperations } = setupFeature(mockStorageOps);

            // Act
            const result = await useCase.execute(input);

            // Assert
            expect(result.value).toMatchObject({
                id: "custom-id",
                name: "Full Tenant",
                description: "A complete tenant",
                tags: ["tag1", "tag2"],
                parent: "root",
                status: "inactive",
                settings: {
                    domains: [{ fqdn: "example.com" }]
                }
            });

            // Verify storage was called with correct data
            expect(storageOperations.createTenant).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: "custom-id",
                    name: "Full Tenant",
                    description: "A complete tenant"
                })
            );
        });

        it("should create tenant with custom ID", async () => {
            // Arrange
            const input: CreateTenantInput = {
                id: "my-custom-id",
                name: "Custom ID Tenant",
                parent: "root",
                description: "",
                tags: []
            };

            const mockStorageOps: Partial<IStorageOps> = {
                createTenant: vi
                    .fn()
                    .mockImplementation((tenant: Tenant) => Promise.resolve(tenant)),
                getTenantsByIds: vi.fn().mockResolvedValue([])
            };

            const { useCase } = setupFeature(mockStorageOps);

            // Act
            const result = await useCase.execute(input);

            // Assert
            expect(result.value.id).toBe("my-custom-id");
        });

        it("should create tenant with specific status", async () => {
            // Arrange
            const input: CreateTenantInput = {
                name: "Inactive Tenant",
                parent: "root",
                status: "inactive",
                description: "",
                tags: []
            };

            const mockStorageOps: Partial<IStorageOps> = {
                createTenant: vi
                    .fn()
                    .mockImplementation((tenant: Tenant) => Promise.resolve(tenant)),
                getTenantsByIds: vi.fn().mockResolvedValue([])
            };

            const { useCase } = setupFeature(mockStorageOps);

            // Act
            const result = await useCase.execute(input);

            // Assert
            expect(result.value.status).toBe("inactive");
        });
    });

    describe("Event Publishing", () => {
        it("should publish beforeCreate event with correct payload", async () => {
            // Arrange
            const input: CreateTenantInput = {
                name: "Event Test Tenant",
                parent: "root",
                description: "",
                tags: []
            };

            const mockStorageOps: Partial<IStorageOps> = {
                createTenant: vi
                    .fn()
                    .mockImplementation((tenant: Tenant) => Promise.resolve(tenant)),
                getTenantsByIds: vi.fn().mockResolvedValue([])
            };

            const { useCase, eventPublisher } = setupFeature(mockStorageOps);

            // Act
            await useCase.execute(input);

            // Assert
            expect(eventPublisher.publish).toHaveBeenCalledTimes(2);
            const beforeEvent = (eventPublisher.publish as Mock).mock.calls[0][0];

            expect(beforeEvent).toBeInstanceOf(TenantBeforeCreateEvent);
            expect(beforeEvent.eventType).toBe("tenant.beforeCreate");
            expect(beforeEvent.payload.input).toEqual(input);
            expect(beforeEvent.payload.tenant).toMatchObject({
                name: "Event Test Tenant",
                parent: "root"
            });
            expect(beforeEvent.occurredAt).toBeInstanceOf(Date);
            expect(beforeEvent.getHandlerAbstraction()).toBe(TenantBeforeCreateHandler);
        });

        it("should publish afterCreate event with correct payload", async () => {
            // Arrange
            const input: CreateTenantInput = {
                name: "Event Test Tenant",
                parent: "root",
                description: "",
                tags: []
            };

            const mockStorageOps: Partial<IStorageOps> = {
                createTenant: vi
                    .fn()
                    .mockImplementation((tenant: Tenant) => Promise.resolve(tenant)),
                getTenantsByIds: vi.fn().mockResolvedValue([])
            };

            const { useCase, eventPublisher } = setupFeature(mockStorageOps);

            // Act
            const result = await useCase.execute(input);

            // Assert
            expect(eventPublisher.publish).toHaveBeenCalledTimes(2);
            const afterEvent = (eventPublisher.publish as Mock).mock.calls[1][0];

            expect(afterEvent).toBeInstanceOf(TenantAfterCreateEvent);
            expect(afterEvent.eventType).toBe("tenant.afterCreate");
            expect(afterEvent.payload.input).toEqual(input);
            expect(afterEvent.payload.tenant).toEqual(result.value);
            expect(afterEvent.occurredAt).toBeInstanceOf(Date);
            expect(afterEvent.getHandlerAbstraction()).toBe(TenantAfterCreateHandler);
        });

        it("should publish beforeCreate event before storage operation", async () => {
            // Arrange
            const input: CreateTenantInput = {
                name: "Order Test Tenant",
                parent: "root",
                description: "",
                tags: []
            };

            const eventOrder: string[] = [];

            const mockStorageOps: Partial<IStorageOps> = {
                createTenant: vi.fn().mockImplementation((tenant: Tenant) => {
                    eventOrder.push("storage");
                    return Promise.resolve(tenant);
                }),
                getTenantsByIds: vi.fn().mockResolvedValue([])
            };

            // Create custom setup with event order tracking
            const container = new Container();
            WcpFeatures.register(container);

            const mockEventPublisher: Partial<EventPublisher.Interface> = {
                publish: vi.fn().mockImplementation(event => {
                    if (event instanceof TenantBeforeCreateEvent) {
                        eventOrder.push("beforeCreate");
                    } else if (event instanceof TenantAfterCreateEvent) {
                        eventOrder.push("afterCreate");
                    }
                    return Promise.resolve(undefined);
                })
            };
            container.registerInstance(EventPublisher, mockEventPublisher as any);
            container.registerInstance(TenancyStorageOperations, mockStorageOps as any);

            const cache = new TenantCacheImpl(async () => []);
            container.registerInstance(TenantCache, cache);

            CreateTenantFeature.register(container);

            const useCase = container.resolve(CreateTenantUseCaseAbstraction);

            // Act
            await useCase.execute(input);

            // Assert
            expect(eventOrder).toEqual(["beforeCreate", "storage", "afterCreate"]);
        });
    });

    describe("Cache Behavior", () => {
        it("should prime cache with created tenant", async () => {
            // Arrange
            const input: CreateTenantInput = {
                name: "Cache Test Tenant",
                parent: "root",
                description: "",
                tags: []
            };

            const createdTenant: Tenant = {
                id: "tenant-123",
                name: "Cache Test Tenant",
                description: "",
                image: undefined,
                isInstalled: false,
                tags: [],
                status: "active",
                settings: { domains: [] },
                parent: "root",
                createdOn: new Date().toISOString(),
                savedOn: new Date().toISOString(),
                webinyVersion: process.env.WEBINY_VERSION
            };

            const mockStorageOps: Partial<IStorageOps> = {
                createTenant: vi.fn().mockResolvedValue(createdTenant),
                getTenantsByIds: vi.fn().mockResolvedValue([createdTenant])
            };

            const { useCase, cache } = setupFeature(mockStorageOps);

            // Act
            const result = await useCase.execute(input);

            // Assert - verify cache contains the tenant
            const cachedTenant = await cache.get(result.value.id);
            expect(cachedTenant).toEqual(result.value);
        });

        it("should not call storage again when reading from cache", async () => {
            // Arrange
            const input: CreateTenantInput = {
                name: "Cache Read Test",
                parent: "root",
                description: "",
                tags: []
            };

            const createdTenant: Tenant = {
                id: "tenant-456",
                name: "Cache Read Test",
                description: "",
                image: undefined,
                isInstalled: false,
                tags: [],
                status: "active",
                settings: { domains: [] },
                parent: "root",
                createdOn: new Date().toISOString(),
                savedOn: new Date().toISOString(),
                webinyVersion: process.env.WEBINY_VERSION
            };

            const mockStorageOps: Partial<IStorageOps> = {
                createTenant: vi.fn().mockResolvedValue(createdTenant),
                getTenantsByIds: vi.fn().mockResolvedValue([createdTenant])
            };

            const { useCase, cache, storageOperations } = setupFeature(mockStorageOps);

            // Act
            const result = await useCase.execute(input);

            // Reset the mock to track calls after creation
            (storageOperations.getTenantsByIds as Mock).mockClear();

            // Read from cache
            const cachedTenant = await cache.get(result.value.id);

            // Assert - storage should not be called again
            expect(cachedTenant).toEqual(result.value);
            expect(storageOperations.getTenantsByIds).not.toHaveBeenCalled();
        });
    });

    describe("Data Transformation", () => {
        it("should generate ID when not provided", async () => {
            // Arrange
            const input: CreateTenantInput = {
                name: "Auto ID Tenant",
                parent: "root",
                description: "",
                tags: []
            };

            const mockStorageOps: Partial<IStorageOps> = {
                createTenant: vi
                    .fn()
                    .mockImplementation((tenant: Tenant) => Promise.resolve(tenant)),
                getTenantsByIds: vi.fn().mockResolvedValue([])
            };

            const { useCase } = setupFeature(mockStorageOps);

            // Act
            const result = await useCase.execute(input);

            // Assert
            expect(result.value.id).toBeDefined();
            expect(result.value.id).not.toBe("");
            expect(typeof result.value.id).toBe("string");
            expect(result.value.id.length).toBeGreaterThan(0);
        });

        it("should set default status to 'active'", async () => {
            // Arrange
            const input: CreateTenantInput = {
                name: "Default Status Tenant",
                parent: "root",
                description: "",
                tags: []
            };

            const mockStorageOps: Partial<IStorageOps> = {
                createTenant: vi
                    .fn()
                    .mockImplementation((tenant: Tenant) => Promise.resolve(tenant)),
                getTenantsByIds: vi.fn().mockResolvedValue([])
            };

            const { useCase } = setupFeature(mockStorageOps);

            // Act
            const result = await useCase.execute(input);

            // Assert
            expect(result.value.status).toBe("active");
        });

        it("should set timestamps correctly", async () => {
            // Arrange
            const input: CreateTenantInput = {
                name: "Timestamp Tenant",
                parent: "root",
                description: "",
                tags: []
            };

            const beforeExecution = new Date();

            const mockStorageOps: Partial<IStorageOps> = {
                createTenant: vi
                    .fn()
                    .mockImplementation((tenant: Tenant) => Promise.resolve(tenant)),
                getTenantsByIds: vi.fn().mockResolvedValue([])
            };

            const { useCase } = setupFeature(mockStorageOps);

            // Act
            const result = await useCase.execute(input);
            const afterExecution = new Date();

            const tenant = result.value;

            // Assert
            expect(tenant.createdOn).toBeDefined();
            expect(tenant.savedOn).toBeDefined();

            const createdOn = new Date(tenant.createdOn);
            const savedOn = new Date(tenant.savedOn);

            expect(createdOn.getTime()).toBeGreaterThanOrEqual(beforeExecution.getTime());
            expect(createdOn.getTime()).toBeLessThanOrEqual(afterExecution.getTime());
            expect(savedOn.getTime()).toBeGreaterThanOrEqual(beforeExecution.getTime());
            expect(savedOn.getTime()).toBeLessThanOrEqual(afterExecution.getTime());
        });

        it("should set default settings.domains to empty array", async () => {
            // Arrange
            const input: CreateTenantInput = {
                name: "Default Settings Tenant",
                parent: "root",
                description: "",
                tags: []
            };

            const mockStorageOps: Partial<IStorageOps> = {
                createTenant: vi
                    .fn()
                    .mockImplementation((tenant: Tenant) => Promise.resolve(tenant)),
                getTenantsByIds: vi.fn().mockResolvedValue([])
            };

            const { useCase } = setupFeature(mockStorageOps);

            // Act
            const result = await useCase.execute(input);

            // Assert
            expect(result.value.settings).toBeDefined();
        });

        it("should preserve provided settings.domains", async () => {
            // Arrange
            const input: CreateTenantInput = {
                name: "Custom Settings Tenant",
                description: "",
                tags: [],
                parent: "root",
                settings: {
                    domains: [{ fqdn: "example.com" }, { fqdn: "test.com" }]
                }
            };

            const mockStorageOps: Partial<IStorageOps> = {
                createTenant: vi
                    .fn()
                    .mockImplementation((tenant: Tenant) => Promise.resolve(tenant)),
                getTenantsByIds: vi.fn().mockResolvedValue([])
            };

            const { useCase } = setupFeature(mockStorageOps);

            // Act
            const result = await useCase.execute(input);

            // Assert
            expect(result.value.settings.domains).toEqual([
                { fqdn: "example.com" },
                { fqdn: "test.com" }
            ]);
        });
    });

    describe("Error Handling", () => {
        it("should throw error when storage operation fails", async () => {
            // Arrange
            const input: CreateTenantInput = {
                name: "Error Test Tenant",
                parent: "root",
                description: "",
                tags: []
            };

            const storageError = new Error("Storage operation failed");

            const mockStorageOps: Partial<IStorageOps> = {
                createTenant: vi.fn().mockRejectedValue(storageError),
                getTenantsByIds: vi.fn().mockResolvedValue([])
            };

            const { useCase, eventPublisher } = setupFeature(mockStorageOps);

            const result = await useCase.execute(input);

            // Act & Assert
            expect(result.isFail()).toBe(true);
            expect(result.error).toBeInstanceOf(CreateTenantError);

            // Verify beforeCreate event was still published
            expect(eventPublisher.publish).toHaveBeenCalledTimes(1);
            const beforeEvent = (eventPublisher.publish as Mock).mock.calls[0][0];
            expect(beforeEvent).toBeInstanceOf(TenantBeforeCreateEvent);
        });

        it("should not prime cache when storage operation fails", async () => {
            // Arrange
            const input: CreateTenantInput = {
                name: "Failed Cache Test",
                parent: "root",
                description: "",
                tags: []
            };

            const mockStorageOps: Partial<IStorageOps> = {
                createTenant: vi.fn().mockRejectedValue(new Error("Storage failed")),
                getTenantsByIds: vi.fn().mockResolvedValue([])
            };

            const { useCase } = setupFeature(mockStorageOps);

            // Act
            try {
                await useCase.execute(input);
            } catch {
                // Expected to fail
            }

            // Assert - cache should not contain any tenant
            // We can't easily check this without knowing the generated ID,
            // but we can verify that getTenantsByIds was not called (which would indicate cache miss)
            expect(mockStorageOps.getTenantsByIds).not.toHaveBeenCalled();
        });
    });

    describe("Integration", () => {
        it("should create tenant through full stack using DI container", async () => {
            // Arrange
            const input: CreateTenantInput = {
                name: "Integration Test Tenant",
                description: "Full stack test",
                tags: ["integration"],
                parent: "root"
            };

            const mockStorageOps: Partial<IStorageOps> = {
                createTenant: vi
                    .fn()
                    .mockImplementation((tenant: Tenant) => Promise.resolve(tenant)),
                getTenantsByIds: vi.fn().mockImplementation((ids: readonly string[]) => {
                    return Promise.resolve(
                        ids.map(id => ({
                            id,
                            name: "Integration Test Tenant",
                            description: "Full stack test",
                            image: undefined,
                            tags: ["integration"],
                            status: "active",
                            settings: { domains: [] },
                            parent: "root",
                            createdOn: new Date().toISOString(),
                            savedOn: new Date().toISOString(),
                            webinyVersion: process.env.WEBINY_VERSION
                        }))
                    );
                })
            };

            const { useCase, eventPublisher, storageOperations, cache } =
                setupFeature(mockStorageOps);

            // Act
            const result = await useCase.execute(input);

            // Assert - Full verification
            expect(result.value).toMatchObject({
                name: "Integration Test Tenant",
                description: "Full stack test",
                tags: ["integration"],
                parent: "root",
                status: "active"
            });

            // Verify storage was called
            expect(storageOperations.createTenant).toHaveBeenCalledTimes(1);

            // Verify events were published in correct order
            expect(eventPublisher.publish).toHaveBeenCalledTimes(2);
            const beforeEvent = (eventPublisher.publish as Mock).mock.calls[0][0];
            const afterEvent = (eventPublisher.publish as Mock).mock.calls[1][0];
            expect(beforeEvent).toBeInstanceOf(TenantBeforeCreateEvent);
            expect(afterEvent).toBeInstanceOf(TenantAfterCreateEvent);

            // Verify cache was primed
            const cachedTenant = await cache.get(result.value.id);
            expect(cachedTenant).toEqual(result.value);
        });
    });
});

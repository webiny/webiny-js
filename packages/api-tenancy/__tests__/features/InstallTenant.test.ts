import { describe, it, vi, expect, Mock } from "vitest";
import { Container } from "@webiny/di-container";
import { EventPublisher } from "@webiny/api-core";
import { WcpFeatures } from "@webiny/api-wcp";
import { InstallTenantFeature } from "~/features/InstallTenant/index.js";
import { InstallTenantUseCase } from "~/features/InstallTenant/index.js";
import { AppInstaller } from "~/features/InstallTenant/index.js";
import { TenantInstalledEvent } from "~/features/InstallTenant/events.js";
import {
    InstallTenantError,
    InstallationDependencyError
} from "~/features/InstallTenant/errors.js";
import type { Tenant, TenantInstallationInput } from "~/features/InstallTenant/abstractions.js";
import type { IAppInstaller } from "~/features/InstallTenant/abstractions.js";
import { UpdateTenantFeature } from "~/features/UpdateTenant/index.js";
import { GetTenantByIdFeature } from "~/features/GetTenantById/feature.js";
import { TenancyStorageOperations } from "~/features/shared/storageOperations.js";
import { TenantCache } from "~/features/shared/abstractions.js";
import { TenantCache as TenantCacheImpl } from "~/features/shared/TenantCache.js";
import type { TenancyStorageOperations as IStorageOps } from "~/types";

describe("InstallTenant Feature", () => {
    /**
     * Mock App Installer: CMS
     * No dependencies
     */
    class MockCmsInstaller implements IAppInstaller {
        readonly appName = "cms";
        readonly dependsOn: string[] = [];

        install = vi.fn().mockResolvedValue(undefined);
        uninstall = vi.fn().mockResolvedValue(undefined);
    }

    /**
     * Mock App Installer: Page Builder
     * Depends on CMS
     */
    class MockPageBuilderInstaller implements IAppInstaller {
        readonly appName = "pageBuilder";
        readonly dependsOn = ["cms"];

        install = vi.fn().mockResolvedValue(undefined);
        uninstall = vi.fn().mockResolvedValue(undefined);
    }

    /**
     * Mock App Installer: Form Builder
     * Depends on CMS
     */
    class MockFormBuilderInstaller implements IAppInstaller {
        readonly appName = "formBuilder";
        readonly dependsOn = ["cms"];

        install = vi.fn().mockResolvedValue(undefined);
        uninstall = vi.fn().mockResolvedValue(undefined);
    }

    /**
     * Test Setup Factory
     * Creates a DI container with the InstallTenant feature registered
     * and mocked infrastructure (storage operations, event publisher)
     */
    const setupFeature = (installers: IAppInstaller[], mockStorageOps?: Partial<IStorageOps>) => {
        const container = new Container();
        WcpFeatures.register(container);

        // Mock EventPublisher to spy on published events
        const mockEventPublisher: Partial<EventPublisher.Interface> = {
            publish: vi.fn().mockResolvedValue(undefined)
        };
        container.registerInstance(EventPublisher, mockEventPublisher as any);

        // Register storage operations abstraction with mocked implementation
        const defaultMockStorageOps: Partial<IStorageOps> = {
            getTenantsByIds: vi.fn().mockResolvedValue([]),
            updateTenant: vi.fn().mockImplementation((tenant: Tenant) => Promise.resolve(tenant)),
            ...mockStorageOps
        };
        container.registerInstance(TenancyStorageOperations, defaultMockStorageOps as any);

        // Register real TenantCache with DataLoader
        const cache = new TenantCacheImpl(async (ids: readonly string[]) => {
            if (ids.length === 0) {
                return [];
            }
            const tenants = await defaultMockStorageOps.getTenantsByIds!(ids);
            return ids.map((_, index) => tenants[index]);
        });
        container.registerInstance(TenantCache, cache);

        // Register app installers
        for (const installer of installers) {
            container.registerInstance(AppInstaller, installer);
        }

        // Register the InstallTenant feature
        InstallTenantFeature.register(container);
        UpdateTenantFeature.register(container);
        GetTenantByIdFeature.register(container);

        // Resolve the use case
        const useCase = container.resolve(InstallTenantUseCase);

        return {
            container,
            useCase,
            cache,
            eventPublisher: mockEventPublisher,
            storageOperations: defaultMockStorageOps,
            installers
        };
    };

    const createMockTenant = (id: string = "tenant-123"): Tenant => ({
        id,
        name: "Test Tenant",
        description: "Test Description",
        image: undefined,
        tags: [],
        status: "active",
        isInstalled: false,
        settings: { domains: [] },
        parent: "root",
        createdOn: new Date().toISOString(),
        savedOn: new Date().toISOString(),
        webinyVersion: process.env.WEBINY_VERSION
    });

    describe("Happy Path: Successful Installation", () => {
        it("should install single app successfully", async () => {
            // Arrange
            const cmsInstaller = new MockCmsInstaller();
            const { useCase, eventPublisher } = setupFeature([cmsInstaller]);

            const tenant = createMockTenant();
            const input: TenantInstallationInput = {
                tenant,
                installationInput: [{ app: "cms", data: { config: "test" } }]
            };

            // Act
            const result = await useCase.execute(input);

            // Assert
            expect(result.isOk()).toBe(true);
            expect(cmsInstaller.install).toHaveBeenCalledTimes(1);
            expect(cmsInstaller.install).toHaveBeenCalledWith(tenant, { config: "test" });
            expect(cmsInstaller.uninstall).not.toHaveBeenCalled();

            // Verify event was published
            expect(eventPublisher.publish).toHaveBeenCalledTimes(1);
            const event = (eventPublisher.publish as Mock).mock.calls[0][0];
            expect(event).toBeInstanceOf(TenantInstalledEvent);
            expect(event.payload.tenant).toEqual(tenant);
            expect(event.payload.installedApps).toEqual(["cms"]);
        });

        it("should install multiple apps in correct dependency order", async () => {
            // Arrange
            const cmsInstaller = new MockCmsInstaller();
            const pbInstaller = new MockPageBuilderInstaller();
            const fbInstaller = new MockFormBuilderInstaller();

            const { useCase } = setupFeature([cmsInstaller, pbInstaller, fbInstaller]);

            const tenant = createMockTenant();
            const input: TenantInstallationInput = {
                tenant,
                installationInput: [
                    { app: "pageBuilder", data: {} },
                    { app: "cms", data: {} },
                    { app: "formBuilder", data: {} }
                ]
            };

            // Act
            const result = await useCase.execute(input);

            // Assert
            expect(result.isOk()).toBe(true);

            // Verify installation order: cms must be installed before pageBuilder and formBuilder
            const cmsCallOrder = cmsInstaller.install.mock.invocationCallOrder[0];
            const pbCallOrder = pbInstaller.install.mock.invocationCallOrder[0];
            const fbCallOrder = fbInstaller.install.mock.invocationCallOrder[0];

            expect(cmsCallOrder).toBeLessThan(pbCallOrder);
            expect(cmsCallOrder).toBeLessThan(fbCallOrder);

            // All installers should be called
            expect(cmsInstaller.install).toHaveBeenCalledTimes(1);
            expect(pbInstaller.install).toHaveBeenCalledTimes(1);
            expect(fbInstaller.install).toHaveBeenCalledTimes(1);
        });

        it("should pass correct data to each installer", async () => {
            // Arrange
            const cmsInstaller = new MockCmsInstaller();
            const pbInstaller = new MockPageBuilderInstaller();

            const { useCase } = setupFeature([cmsInstaller, pbInstaller]);

            const tenant = createMockTenant();
            const input: TenantInstallationInput = {
                tenant,
                installationInput: [
                    { app: "cms", data: { cmsConfig: "cms-value" } },
                    { app: "pageBuilder", data: { pbConfig: "pb-value" } }
                ]
            };

            // Act
            await useCase.execute(input);

            // Assert
            expect(cmsInstaller.install).toHaveBeenCalledWith(tenant, { cmsConfig: "cms-value" });
            expect(pbInstaller.install).toHaveBeenCalledWith(tenant, { pbConfig: "pb-value" });
        });
    });

    describe("Error Handling: Installation Failures", () => {
        it("should rollback when installation fails", async () => {
            // Arrange
            const cmsInstaller = new MockCmsInstaller();
            const pbInstaller = new MockPageBuilderInstaller();

            // Page Builder will fail
            pbInstaller.install.mockRejectedValueOnce(new Error("PB installation failed"));

            const { useCase, eventPublisher } = setupFeature([cmsInstaller, pbInstaller]);

            const tenant = createMockTenant();
            const input: TenantInstallationInput = {
                tenant,
                installationInput: [
                    { app: "cms", data: {} },
                    { app: "pageBuilder", data: {} }
                ]
            };

            // Act
            const result = await useCase.execute(input);

            // Assert
            expect(result.isFail()).toBe(true);

            const error = result.error as InstallTenantError;

            expect(error).toBeInstanceOf(InstallTenantError);
            expect(error.code).toBe("INSTALL_TENANT");
            expect(error.data.failedApp).toBe("pageBuilder");
            expect(error.data.installedApps).toEqual(["cms"]);

            // Verify CMS was installed and then rolled back
            expect(cmsInstaller.install).toHaveBeenCalledTimes(1);
            expect(cmsInstaller.uninstall).toHaveBeenCalledTimes(1);
            expect(cmsInstaller.uninstall).toHaveBeenCalledWith(tenant);

            // Page Builder should have attempted install but not uninstall
            expect(pbInstaller.install).toHaveBeenCalledTimes(1);
            expect(pbInstaller.uninstall).not.toHaveBeenCalled();

            // No event should be published on failure
            expect(eventPublisher.publish).not.toHaveBeenCalled();
        });

        it("should rollback in reverse order when installation fails", async () => {
            // Arrange
            const cmsInstaller = new MockCmsInstaller();
            const pbInstaller = new MockPageBuilderInstaller();
            const fbInstaller = new MockFormBuilderInstaller();

            // Form Builder will fail
            fbInstaller.install.mockRejectedValueOnce(new Error("FB installation failed"));

            const { useCase } = setupFeature([cmsInstaller, pbInstaller, fbInstaller]);

            const tenant = createMockTenant();
            const input: TenantInstallationInput = {
                tenant,
                installationInput: [
                    { app: "cms", data: {} },
                    { app: "pageBuilder", data: {} },
                    { app: "formBuilder", data: {} }
                ]
            };

            // Act
            const result = await useCase.execute(input);

            // Assert
            expect(result.isFail()).toBe(true);

            // Verify rollback order: PB should be uninstalled before CMS
            const pbUninstallOrder = pbInstaller.uninstall.mock.invocationCallOrder[0];
            const cmsUninstallOrder = cmsInstaller.uninstall.mock.invocationCallOrder[0];

            expect(pbUninstallOrder).toBeLessThan(cmsUninstallOrder);

            // CMS and PB should be uninstalled
            expect(cmsInstaller.uninstall).toHaveBeenCalledTimes(1);
            expect(pbInstaller.uninstall).toHaveBeenCalledTimes(1);

            // FB should not be uninstalled (it was never successfully installed)
            expect(fbInstaller.uninstall).not.toHaveBeenCalled();
        });

        it("should handle rollback failures gracefully", async () => {
            // Arrange
            const cmsInstaller = new MockCmsInstaller();
            const pbInstaller = new MockPageBuilderInstaller();

            // PB installation fails
            pbInstaller.install.mockRejectedValueOnce(new Error("PB installation failed"));

            // CMS uninstall also fails
            cmsInstaller.uninstall.mockRejectedValueOnce(new Error("CMS uninstall failed"));

            const { useCase } = setupFeature([cmsInstaller, pbInstaller]);

            const tenant = createMockTenant();
            const input: TenantInstallationInput = {
                tenant,
                installationInput: [
                    { app: "cms", data: {} },
                    { app: "pageBuilder", data: {} }
                ]
            };

            // Act
            const result = await useCase.execute(input);

            // Assert - Should still return the installation error, not the rollback error
            expect(result.isFail()).toBe(true);
            const error = result.error as InstallTenantError;
            expect(error.data.failedApp).toBe("pageBuilder");

            // Verify rollback was attempted
            expect(cmsInstaller.uninstall).toHaveBeenCalledTimes(1);
        });

        it("should not install when first app fails", async () => {
            // Arrange
            const cmsInstaller = new MockCmsInstaller();
            const pbInstaller = new MockPageBuilderInstaller();

            // CMS installation fails
            cmsInstaller.install.mockRejectedValueOnce(new Error("CMS installation failed"));

            const { useCase } = setupFeature([cmsInstaller, pbInstaller]);

            const tenant = createMockTenant();
            const input: TenantInstallationInput = {
                tenant,
                installationInput: [
                    { app: "cms", data: {} },
                    { app: "pageBuilder", data: {} }
                ]
            };

            // Act
            const result = await useCase.execute(input);

            // Assert
            expect(result.isFail()).toBe(true);
            const error = result.error as InstallTenantError;
            expect(error.data.failedApp).toBe("cms");
            expect(error.data.installedApps).toEqual([]);

            // PB should never be called
            expect(pbInstaller.install).not.toHaveBeenCalled();

            // No rollback needed
            expect(cmsInstaller.uninstall).not.toHaveBeenCalled();
        });
    });

    describe("Dependency Resolution", () => {
        it("should fail when installer not found", async () => {
            // Arrange
            const cmsInstaller = new MockCmsInstaller();
            const { useCase } = setupFeature([cmsInstaller]);

            const tenant = createMockTenant();
            const input: TenantInstallationInput = {
                tenant,
                installationInput: [{ app: "nonExistent", data: {} }]
            };

            // Act
            const result = await useCase.execute(input);

            // Assert
            expect(result.isFail()).toBe(true);
            const error = result.error as InstallationDependencyError;
            expect(error).toBeInstanceOf(InstallationDependencyError);
            expect(error.code).toBe("INSTALLATION_DEPENDENCY");
            expect(error.message).toContain("No installer found for app: nonExistent");
        });

        it("should fail when dependency not included in installation", async () => {
            // Arrange
            const cmsInstaller = new MockCmsInstaller();
            const pbInstaller = new MockPageBuilderInstaller();

            const { useCase } = setupFeature([cmsInstaller, pbInstaller]);

            const tenant = createMockTenant();
            const input: TenantInstallationInput = {
                tenant,
                installationInput: [
                    // Missing CMS, which PB depends on
                    { app: "pageBuilder", data: {} }
                ]
            };

            // Act
            const result = await useCase.execute(input);

            // Assert
            expect(result.isFail()).toBe(true);
            const error = result.error as InstallationDependencyError;
            expect(error).toBeInstanceOf(InstallationDependencyError);
            expect(error.message).toContain('depends on "cms"');
            expect(error.message).toContain("not included in the installation request");
        });

        it("should fail when circular dependency detected", async () => {
            // Arrange
            class CircularAInstaller implements IAppInstaller {
                readonly appName = "appA";
                readonly dependsOn = ["appB"];
                install = vi.fn().mockResolvedValue(undefined);
                uninstall = vi.fn().mockResolvedValue(undefined);
            }

            class CircularBInstaller implements IAppInstaller {
                readonly appName = "appB";
                readonly dependsOn = ["appA"];
                install = vi.fn().mockResolvedValue(undefined);
                uninstall = vi.fn().mockResolvedValue(undefined);
            }

            const appAInstaller = new CircularAInstaller();
            const appBInstaller = new CircularBInstaller();

            const { useCase } = setupFeature([appAInstaller, appBInstaller]);

            const tenant = createMockTenant();
            const input: TenantInstallationInput = {
                tenant,
                installationInput: [
                    { app: "appA", data: {} },
                    { app: "appB", data: {} }
                ]
            };

            // Act
            const result = await useCase.execute(input);

            // Assert
            expect(result.isFail()).toBe(true);
            const error = result.error as InstallationDependencyError;
            expect(error).toBeInstanceOf(InstallationDependencyError);
            expect(error.message).toContain("Circular dependency detected");
        });

        it("should fail when dependency installer does not exist", async () => {
            // Arrange
            class InvalidInstaller implements IAppInstaller {
                readonly appName = "invalid";
                readonly dependsOn = ["nonExistentDep"];
                install = vi.fn().mockResolvedValue(undefined);
                uninstall = vi.fn().mockResolvedValue(undefined);
            }

            const invalidInstaller = new InvalidInstaller();
            const { useCase } = setupFeature([invalidInstaller]);

            const tenant = createMockTenant();
            const input: TenantInstallationInput = {
                tenant,
                installationInput: [{ app: "invalid", data: {} }]
            };

            // Act
            const result = await useCase.execute(input);

            // Assert
            expect(result.isFail()).toBe(true);
            const error = result.error as InstallationDependencyError;
            expect(error).toBeInstanceOf(InstallationDependencyError);
            expect(error.message).toContain('depends on "nonExistentDep"');
            expect(error.message).toContain("no installer exists");
        });
    });

    describe("Event Publishing", () => {
        it("should publish TenantInstalledEvent with correct payload", async () => {
            // Arrange
            const cmsInstaller = new MockCmsInstaller();
            const pbInstaller = new MockPageBuilderInstaller();

            const { useCase, eventPublisher } = setupFeature([cmsInstaller, pbInstaller]);

            const tenant = createMockTenant();
            const input: TenantInstallationInput = {
                tenant,
                installationInput: [
                    { app: "cms", data: {} },
                    { app: "pageBuilder", data: {} }
                ]
            };

            // Act
            await useCase.execute(input);

            // Assert
            expect(eventPublisher.publish).toHaveBeenCalledTimes(1);
            const event = (eventPublisher.publish as Mock).mock.calls[0][0];

            expect(event).toBeInstanceOf(TenantInstalledEvent);
            expect(event.eventType).toBe("tenant.installed");
            expect(event.payload.tenant).toEqual(tenant);
            expect(event.payload.installedApps).toEqual(["cms", "pageBuilder"]);
            expect(event.occurredAt).toBeInstanceOf(Date);
        });

        it("should not publish event when installation fails", async () => {
            // Arrange
            const cmsInstaller = new MockCmsInstaller();
            cmsInstaller.install.mockRejectedValueOnce(new Error("Installation failed"));

            const { useCase, eventPublisher } = setupFeature([cmsInstaller]);

            const tenant = createMockTenant();
            const input: TenantInstallationInput = {
                tenant,
                installationInput: [{ app: "cms", data: {} }]
            };

            // Act
            await useCase.execute(input);

            // Assert
            expect(eventPublisher.publish).not.toHaveBeenCalled();
        });

        it("should not publish event when dependency resolution fails", async () => {
            // Arrange
            const cmsInstaller = new MockCmsInstaller();
            const { useCase, eventPublisher } = setupFeature([cmsInstaller]);

            const tenant = createMockTenant();
            const input: TenantInstallationInput = {
                tenant,
                installationInput: [{ app: "nonExistent", data: {} }]
            };

            // Act
            await useCase.execute(input);

            // Assert
            expect(eventPublisher.publish).not.toHaveBeenCalled();
        });
    });

    describe("Integration", () => {
        it("should handle complex dependency tree correctly", async () => {
            // Arrange
            const cmsInstaller = new MockCmsInstaller();
            const pbInstaller = new MockPageBuilderInstaller();
            const fbInstaller = new MockFormBuilderInstaller();

            const { useCase, eventPublisher } = setupFeature([
                cmsInstaller,
                pbInstaller,
                fbInstaller
            ]);

            const tenant = createMockTenant();
            const input: TenantInstallationInput = {
                tenant,
                installationInput: [
                    { app: "formBuilder", data: { fb: "data" } },
                    { app: "pageBuilder", data: { pb: "data" } },
                    { app: "cms", data: { cms: "data" } }
                ]
            };

            // Act
            const result = await useCase.execute(input);

            // Assert
            expect(result.isOk()).toBe(true);

            // Verify installation order
            const cmsOrder = cmsInstaller.install.mock.invocationCallOrder[0];
            const pbOrder = pbInstaller.install.mock.invocationCallOrder[0];
            const fbOrder = fbInstaller.install.mock.invocationCallOrder[0];

            expect(cmsOrder).toBeLessThan(pbOrder);
            expect(cmsOrder).toBeLessThan(fbOrder);

            // All should be installed
            expect(cmsInstaller.install).toHaveBeenCalledTimes(1);
            expect(pbInstaller.install).toHaveBeenCalledTimes(1);
            expect(fbInstaller.install).toHaveBeenCalledTimes(1);

            // Event should list all installed apps in correct order
            const event = (eventPublisher.publish as Mock).mock.calls[0][0];
            expect(event.payload.installedApps.sort()).toEqual(
                ["cms", "pageBuilder", "formBuilder"].sort()
            );
        });

        it("should work with empty installation list", async () => {
            // Arrange
            const { useCase, eventPublisher } = setupFeature([]);

            const tenant = createMockTenant();
            const input: TenantInstallationInput = {
                tenant,
                installationInput: []
            };

            // Act
            const result = await useCase.execute(input);

            // Assert
            expect(result.isOk()).toBe(true);

            // Event should be published with empty list
            expect(eventPublisher.publish).toHaveBeenCalledTimes(1);
            const event = (eventPublisher.publish as Mock).mock.calls[0][0];
            expect(event.payload.installedApps).toEqual([]);
        });
    });
});

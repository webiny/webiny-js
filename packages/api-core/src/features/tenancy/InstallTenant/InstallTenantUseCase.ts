import { Result, createImplementation } from "@webiny/feature/api";
import { EventPublisher } from "~/features/eventPublisher/index.js";
import { InstallTenantUseCase as UseCaseAbstraction } from "./abstractions.js";
import { AppInstaller } from "./abstractions.js";
import { InstallTenantError, InstallationDependencyError } from "./errors.js";
import { TenantInstalledEvent } from "./events.js";
import { DependencyResolver } from "./DependencyResolver.js";
import type { TenantInstallationInput } from "./abstractions.js";
import { UpdateTenantUseCase } from "~/features/tenancy/UpdateTenant/index.js";
import { TenantScopes } from "~/features/tenancy/TenantScopes/abstractions.js";

type InstalledApp = { appName: string; installer: AppInstaller.Interface };

class InstallTenantUseCaseImpl implements UseCaseAbstraction.Interface {
    private resolver: DependencyResolver;

    constructor(
        private tenantScopes: TenantScopes.Interface,
        private eventPublisher: EventPublisher.Interface,
        private updateTenantUseCase: UpdateTenantUseCase.Interface
    ) {
        this.resolver = new DependencyResolver();
    }

    async execute({ tenant, installationInput }: TenantInstallationInput) {
        const installedApps: InstalledApp[] = [];

        try {
            /**
             * The installers run in the new tenant's scope: resolved from it, they write to the new
             * tenant's storage. The rollback of a failed installer runs there too.
             */
            const result = await this.tenantScopes.withTenant(tenant, scope => {
                return this.install(
                    scope.resolveAll(AppInstaller),
                    tenant,
                    installationInput,
                    installedApps
                );
            });

            if (result.isFail()) {
                return result;
            }

            /**
             * Back in the caller's tenant, which keeps the tenant's record.
             */

            // Mark the tenant as installed
            await this.updateTenantUseCase.execute(tenant.id, {
                isInstalled: true,
                status: "enabled"
            });

            // Publish the installed event
            await this.eventPublisher.publish(
                new TenantInstalledEvent({
                    tenant: tenant,
                    installedApps: installedApps.map(i => i.appName)
                })
            );

            return Result.ok();
        } catch (error) {
            // Unexpected error during the installation, or while marking the tenant as installed.
            await this.rollbackInScope(tenant, installedApps);

            return Result.fail(
                new InstallTenantError({
                    reason: error instanceof Error ? error.message : String(error),
                    failedApp: "unknown",
                    installedApps: installedApps.map(i => i.appName),
                    cause: error instanceof Error ? error : undefined
                })
            );
        }
    }

    /** Runs in the new tenant's scope, with that scope's installers. */
    private async install(
        appInstallers: AppInstaller.Interface[],
        tenant: TenantInstallationInput["tenant"],
        installationInput: TenantInstallationInput["installationInput"],
        installedApps: InstalledApp[]
    ): Promise<Awaited<ReturnType<UseCaseAbstraction.Interface["execute"]>>> {
        const installerMap = new Map(
            appInstallers.map(installer => [installer.appName, installer])
        );
        const dataMap = new Map(installationInput.map(install => [install.app, install.data]));

        // Resolve installation order
        let installationOrder: string[];
        try {
            installationOrder = this.resolver.resolve(appInstallers, installationInput);
        } catch (error) {
            if (error instanceof InstallationDependencyError) {
                return Result.fail(error);
            }
            return Result.fail(
                new InstallationDependencyError({
                    reason: error instanceof Error ? error.message : String(error)
                })
            );
        }

        // Execute installations in order
        for (const appName of installationOrder) {
            const installer = installerMap.get(appName)!;
            const data = dataMap.get(appName)!;

            try {
                await installer.install(tenant, data);
                installedApps.push({ appName, installer });
            } catch (error) {
                // Installation failed - rollback everything
                console.error(`✗ ${appName} installation failed:`, error);
                await this.rollback(tenant, installedApps);

                return Result.fail(
                    new InstallTenantError({
                        reason: error instanceof Error ? error.message : String(error),
                        failedApp: appName,
                        installedApps: installedApps.map(i => i.appName),
                        cause: error instanceof Error ? error : undefined
                    })
                );
            }
        }
        return Result.ok();
    }

    /** Rolls back outside the installation callback: the installers belong to the new tenant's scope. */
    private async rollbackInScope(
        tenant: TenantInstallationInput["tenant"],
        installedApps: InstalledApp[]
    ): Promise<void> {
        if (installedApps.length === 0) {
            return;
        }
        try {
            await this.tenantScopes.withTenant(tenant, () => this.rollback(tenant, installedApps));
        } catch (error) {
            console.error(`✗ Failed to rollback the installation of tenant "${tenant.id}":`, error);
        }
    }

    private async rollback(
        tenant: TenantInstallationInput["tenant"],
        installedApps: InstalledApp[]
    ): Promise<void> {
        if (installedApps.length === 0) {
            return;
        }

        // Rollback in REVERSE order (last installed first)
        const errors: Array<{ appName: string; error: Error }> = [];

        for (let i = installedApps.length - 1; i >= 0; i--) {
            const { appName, installer } = installedApps[i];

            try {
                await installer.uninstall(tenant);
            } catch (error) {
                console.error(`✗ Failed to rollback ${appName}:`, error);
                errors.push({
                    appName,
                    error: error as Error
                });
            }
        }

        if (errors.length > 0) {
            console.error(
                `Warning: ${errors.length} rollback(s) failed:`,
                errors.map(e => `${e.appName}: ${e.error.message}`).join(", ")
            );
        }
    }
}

export const InstallTenantUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: InstallTenantUseCaseImpl,
    dependencies: [TenantScopes, EventPublisher, UpdateTenantUseCase]
});

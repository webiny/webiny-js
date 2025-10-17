import { Result, createImplementation } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core";
import { InstallTenantUseCase as UseCaseAbstraction } from "./abstractions.js";
import { AppInstaller } from "./abstractions.js";
import { InstallTenantError, InstallationDependencyError } from "./errors.js";
import { TenantInstalledEvent } from "./events.js";
import { DependencyResolver } from "./DependencyResolver.js";
import type { TenantInstallationInput } from "./abstractions.js";
import { UpdateTenantUseCase } from "~/features/UpdateTenant/index.js";

class InstallTenantUseCaseImpl implements UseCaseAbstraction.Interface {
    private resolver: DependencyResolver;

    constructor(
        private eventPublisher: EventPublisher.Interface,
        private appInstallers: AppInstaller.Interface[],
        private updateTenantUseCase: UpdateTenantUseCase.Interface
    ) {
        this.resolver = new DependencyResolver();
    }

    async execute({ tenant, installationInput }: TenantInstallationInput) {
        const installerMap = new Map(
            this.appInstallers.map(installer => [installer.appName, installer])
        );

        const dataMap = new Map(installationInput.map(install => [install.app, install.data]));

        // Resolve installation order
        let installationOrder: string[];
        try {
            installationOrder = this.resolver.resolve(
                this.appInstallers.map(i => ({
                    appName: i.appName,
                    dependsOn: i.dependsOn
                })),
                installationInput
            );
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

        console.log(`Installation order: ${installationOrder.join(" → ")}`);

        const installedApps: Array<{ appName: string; installer: AppInstaller.Interface }> = [];

        try {
            // Execute installations in order
            for (const appName of installationOrder) {
                const installer = installerMap.get(appName)!;
                const data = dataMap.get(appName)!;

                console.log(`Installing ${appName}...`);

                try {
                    await installer.install(tenant, data);
                    installedApps.push({ appName, installer });
                    console.log(`✓ ${appName} installed successfully`);
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

            console.log("✓ All installations completed successfully");

            await this.updateTenantUseCase.execute(tenant.id, {
                isInstalled: true
            });

            // Publish the installed event
            await this.eventPublisher.publish(
                new TenantInstalledEvent({
                    tenant: tenant,
                    installedApps: installationOrder
                })
            );

            return Result.ok(undefined);
        } catch (error) {
            // Unexpected error during installation loop
            await this.rollback(tenant, installedApps);

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

    private async rollback(
        tenant: TenantInstallationInput["tenant"],
        installedApps: Array<{ appName: string; installer: AppInstaller.Interface }>
    ): Promise<void> {
        if (installedApps.length === 0) {
            return;
        }

        console.log(`Rolling back ${installedApps.length} installations...`);

        // Rollback in REVERSE order (last installed first)
        const errors: Array<{ appName: string; error: Error }> = [];

        for (let i = installedApps.length - 1; i >= 0; i--) {
            const { appName, installer } = installedApps[i];

            try {
                console.log(`Rolling back ${appName}...`);
                await installer.uninstall(tenant);
                console.log(`✓ ${appName} rolled back successfully`);
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
    dependencies: [EventPublisher, [AppInstaller, { multiple: true }], UpdateTenantUseCase]
});

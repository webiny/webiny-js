import { createImplementation } from "@webiny/feature/api";
import { AppInstaller } from "@webiny/api-core/features/tenancy/InstallTenant/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import { AI_POWER_UPS_SETTINGS } from "~/api/constants.js";

const ROOT_TENANT_ID = "root";

/**
 * Starts a new tenant with the root tenant's AI Power-Ups settings: connections, model roles,
 * capabilities, personas and projects, so the tenant can use AI without being set up by hand.
 *
 * The stored record is copied as it is, not read and saved through the use cases. API keys are
 * stored encrypted with the project's key, which every tenant shares, so they decrypt in the new
 * tenant unchanged; going through the mappers would only see them as masks. It also keeps the
 * settings cache out of it: that cache is not keyed by tenant, and an install switches tenants.
 *
 * Installers run inside the new tenant's context, so `keyValueStore` writes to the new tenant.
 */
class SeedTenantSettingsInstallerImpl implements AppInstaller.Interface {
    readonly alwaysRun = true;
    readonly appName = "AiPowerUps";
    readonly dependsOn = [];

    constructor(
        private tenantContext: TenantContext.Interface,
        private keyValueStore: KeyValueStore.Interface
    ) {}

    async install(tenant: Tenant): Promise<void> {
        if (tenant.id === ROOT_TENANT_ID) {
            return;
        }

        // A tenant that already has settings keeps them: copying is only ever a starting point.
        const existing = await this.keyValueStore.get(AI_POWER_UPS_SETTINGS);
        if (existing.isOk() && existing.value) {
            return;
        }

        const root = await this.tenantContext.withRootTenant(() =>
            this.keyValueStore.get<Record<string, unknown>>(AI_POWER_UPS_SETTINGS)
        );
        // Root has never saved its settings: the new tenant starts from the defaults, as root does.
        if (root.isFail() || !root.value) {
            return;
        }

        const written = await this.keyValueStore.set(AI_POWER_UPS_SETTINGS, root.value);
        if (written.isFail()) {
            throw new Error(
                `Could not copy the root tenant's AI Power-Ups settings: ${String(written.error)}`
            );
        }
    }

    async uninstall(): Promise<void> {
        await this.keyValueStore.delete(AI_POWER_UPS_SETTINGS);
    }
}

export const SeedTenantSettingsInstaller = createImplementation({
    abstraction: AppInstaller,
    implementation: SeedTenantSettingsInstallerImpl,
    dependencies: [TenantContext, KeyValueStore]
});

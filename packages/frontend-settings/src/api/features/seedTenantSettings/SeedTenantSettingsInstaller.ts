import { createImplementation } from "@webiny/feature/api";
import { AppInstaller } from "@webiny/api-core/features/tenancy/InstallTenant/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import { FRONTEND_SETTINGS_KEY } from "~/shared/constants.js";
import type { IFrontendSettings } from "~/shared/types.js";

const ROOT_TENANT_ID = "root";
const WB_SETTINGS_KEY = "WebsiteBuilder/Settings";

/**
 * Starts a new tenant with the root tenant's frontend settings: its frontend URL, and the starter
 * kits saved with it, so the Website Builder previews the tenant's pages on the same frontend.
 *
 * Root's URL is read the way the settings query reads it: the frontend settings first, then the
 * Website Builder's older `previewDomain`. A root that has neither leaves the new tenant on the
 * default, as root is.
 *
 * Installers run inside the new tenant's context, so `keyValueStore` writes to the new tenant.
 */
class SeedTenantSettingsInstallerImpl implements AppInstaller.Interface {
    readonly alwaysRun = true;
    readonly appName = "FrontendSettings";
    readonly dependsOn = [];

    constructor(
        private tenantContext: TenantContext.Interface,
        private keyValueStore: KeyValueStore.Interface
    ) {}

    async install(tenant: Tenant): Promise<void> {
        if (tenant.id === ROOT_TENANT_ID) {
            return;
        }

        // A tenant that already has a frontend URL keeps it: copying is only ever a starting point.
        const existing = await this.keyValueStore.get<IFrontendSettings>(FRONTEND_SETTINGS_KEY);
        if (existing.isOk() && existing.value?.domain) {
            return;
        }

        const settings = await this.tenantContext.withRootTenant(() => this.rootSettings());
        if (!settings) {
            return;
        }

        const written = await this.keyValueStore.set(FRONTEND_SETTINGS_KEY, settings);
        if (written.isFail()) {
            throw new Error(
                `Could not copy the root tenant's frontend settings: ${String(written.error)}`
            );
        }
    }

    async uninstall(): Promise<void> {
        await this.keyValueStore.delete(FRONTEND_SETTINGS_KEY);
    }

    private async rootSettings(): Promise<IFrontendSettings | null> {
        const frontend = await this.keyValueStore.get<IFrontendSettings>(FRONTEND_SETTINGS_KEY);
        if (frontend.isOk() && frontend.value?.domain) {
            return frontend.value;
        }

        const wb = await this.keyValueStore.get<{ previewDomain?: string }>(WB_SETTINGS_KEY);
        if (wb.isOk() && wb.value?.previewDomain) {
            return { domain: wb.value.previewDomain };
        }

        return null;
    }
}

export const SeedTenantSettingsInstaller = createImplementation({
    abstraction: AppInstaller,
    implementation: SeedTenantSettingsInstallerImpl,
    dependencies: [TenantContext, KeyValueStore]
});

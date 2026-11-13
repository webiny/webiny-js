import { ServiceDiscovery } from "@webiny/api";
import { createImplementation } from "@webiny/feature/api";
import { AppInstaller } from "@webiny/api-core/features/tenancy/InstallTenant/index.js";
import { FILE_MANAGER_GENERAL_SETTINGS } from "~/domain/settings/constants.js";
import { UpdateSettingsUseCase } from "~/features/settings/UpdateSettings/abstractions.js";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";

class SettingsInstallerImpl implements AppInstaller.Interface {
    readonly alwaysRun = true;
    readonly appName = "FileManager";
    readonly dependsOn = [];

    constructor(
        private identityContext: IdentityContext.Interface,
        private updateSettings: UpdateSettingsUseCase.Interface,
        private keyValueStore: KeyValueStore.Interface
    ) {}

    async install(): Promise<void> {
        // TODO: move this to api-core with a proper abstraction
        const manifest = await ServiceDiscovery.load();

        // If no records in the database, `manifest` object is empty POJO.
        // That's why the heavy `?.` usage.
        const domain = manifest?.api?.cloudfront?.domain;

        // The installer can run as the caller (e.g. Tenant Manager creating a tenant),
        // and the value comes from the API's own URL, not from caller input.
        await this.identityContext.withoutAuthorization(() => {
            return this.updateSettings.execute({
                // An empty value makes validation fall back to an empty prefix.
                srcPrefix: domain ? `${domain}/files` : ""
            });
        });
    }

    async uninstall(): Promise<void> {
        await this.keyValueStore.delete(FILE_MANAGER_GENERAL_SETTINGS);
    }
}

export const SettingsInstaller = createImplementation({
    abstraction: AppInstaller,
    implementation: SettingsInstallerImpl,
    dependencies: [IdentityContext, UpdateSettingsUseCase, KeyValueStore]
});

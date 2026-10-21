import { createImplementation } from "@webiny/feature/api";
import { AppInstaller } from "@webiny/api-core/features/tenancy/InstallTenant/index.js";
import { FILE_MANAGER_GENERAL_SETTINGS } from "~/domain/settings/constants.js";
import { UpdateSettingsUseCase } from "~/features/settings/UpdateSettings/abstractions.js";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { PublicUrls } from "@webiny/api-core/features/publicUrls/index.js";

class SettingsInstallerImpl implements AppInstaller.Interface {
    readonly alwaysRun = true;
    readonly appName = "FileManager";
    readonly dependsOn = [];

    constructor(
        private updateSettings: UpdateSettingsUseCase.Interface,
        private keyValueStore: KeyValueStore.Interface,
        private publicUrls: PublicUrls.Interface
    ) {}

    async install(): Promise<void> {
        // Both hosting types serve files through the API's public origin: AWS via the API CloudFront
        // distribution, standalone via the API's own `/files/*` route.
        const apiUrl = (await this.publicUrls.getApiUrl()) ?? "";

        await this.updateSettings.execute({
            srcPrefix: `${apiUrl}/files`
        });
    }

    async uninstall(): Promise<void> {
        await this.keyValueStore.delete(FILE_MANAGER_GENERAL_SETTINGS);
    }
}

export const SettingsInstaller = createImplementation({
    abstraction: AppInstaller,
    implementation: SettingsInstallerImpl,
    dependencies: [UpdateSettingsUseCase, KeyValueStore, PublicUrls]
});

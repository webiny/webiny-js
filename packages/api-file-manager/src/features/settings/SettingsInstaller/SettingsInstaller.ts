import { ServiceDiscovery } from "@webiny/api";
import { createImplementation } from "@webiny/feature/api";
import { AppInstaller } from "@webiny/api-core/features/InstallTenant";
import { FILE_MANAGER_GENERAL_SETTINGS } from "~/domain/settings/constants.js";
import { UpdateSettingsUseCase } from "~/features/settings/UpdateSettings/abstractions.js";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";

class SettingsInstallerImpl implements AppInstaller.Interface {
    readonly alwaysRun = true;
    readonly appName = "FileManager";
    readonly dependsOn = [];

    constructor(
        private updateSettings: UpdateSettingsUseCase.Interface,
        private keyValueStore: KeyValueStore.Interface
    ) {}

    async install(): Promise<void> {
        // TODO: move this to api-core with a proper abstraction
        const manifest = await ServiceDiscovery.load();
        const { domain } = manifest?.api.cloudfront;

        await this.updateSettings.execute({
            srcPrefix: `${domain}/files`
        });
    }

    async uninstall(): Promise<void> {
        await this.keyValueStore.delete(FILE_MANAGER_GENERAL_SETTINGS);
    }
}

export const SettingsInstaller = createImplementation({
    abstraction: AppInstaller,
    implementation: SettingsInstallerImpl,
    dependencies: [UpdateSettingsUseCase, KeyValueStore]
});

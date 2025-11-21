import { ServiceDiscovery } from "@webiny/api";
import { createImplementation } from "@webiny/feature/api";
import { AppInstaller } from "@webiny/api-core/features/InstallTenant";
import { UpdateSettings } from "@webiny/api-core/features/UpdateSettings";
import { DeleteSettings } from "@webiny/api-core/features/DeleteSettings";
import { FILE_MANAGER_GENERAL_SETTINGS } from "~/domain/settings/constants.js";

class SettingsInstallerImpl implements AppInstaller.Interface {
    readonly alwaysRun = true;
    readonly appName = "FileManager";
    readonly dependsOn = [];

    constructor(
        private updateSettings: UpdateSettings.Interface,
        private deleteSettings: DeleteSettings.Interface
    ) {}

    async install(): Promise<void> {
        // TODO: move this to api-core with a proper abstraction
        const manifest = await ServiceDiscovery.load();
        const { domain } = manifest?.api.cloudfront;

        await this.updateSettings.execute({
            name: FILE_MANAGER_GENERAL_SETTINGS,
            data: {
                srcPrefix: `${domain}/files`
            }
        });
    }

    async uninstall(): Promise<void> {
        await this.deleteSettings.execute(FILE_MANAGER_GENERAL_SETTINGS);
    }
}

export const SettingsInstaller = createImplementation({
    abstraction: AppInstaller,
    implementation: SettingsInstallerImpl,
    dependencies: [UpdateSettings, DeleteSettings]
});

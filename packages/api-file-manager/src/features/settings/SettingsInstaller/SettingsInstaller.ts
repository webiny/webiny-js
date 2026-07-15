import { ServiceDiscovery } from "@webiny/api-core/features/serviceDiscovery/index.js";
import { createImplementation } from "@webiny/feature/api";
import { AppInstaller } from "@webiny/api-core/features/tenancy/InstallTenant/index.js";
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

        // If no records in the database, `manifest` object is empty POJO.
        // That's why the heavy `?.` usage.
        //
        // The AWS flavour serves files from a CloudFront domain (in the manifest). The self-hosted
        // (server) flavour has no CloudFront — files are served by the api's own `/files/*` route — so
        // fall back to the configured API origin (WEBINY_API_URL), the same origin the client uses.
        const domain = manifest?.api?.cloudfront?.domain ?? process.env.WEBINY_API_URL ?? "";

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

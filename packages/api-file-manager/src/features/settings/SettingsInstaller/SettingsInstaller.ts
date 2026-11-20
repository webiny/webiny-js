import { createImplementation } from "@webiny/feature/api";
import { AppInstaller } from "@webiny/api-core/features/tenancy/InstallTenant/index.js";
import { FILE_MANAGER_GENERAL_SETTINGS } from "~/domain/settings/constants.js";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";

class SettingsInstallerImpl implements AppInstaller.Interface {
    readonly alwaysRun = true;
    readonly appName = "FileManager";
    readonly dependsOn = [];

    constructor(private keyValueStore: KeyValueStore.Interface) {}

    async install(): Promise<void> {
        /*
         * Nothing to write. Settings that were never saved read as the defaults, and the file
         * delivery URL defaults to the API's current public URL on every read (DefaultSrcPrefix),
         * so writing it here would only freeze today's URL into the tenant's settings.
         */
    }

    async uninstall(): Promise<void> {
        await this.keyValueStore.delete(FILE_MANAGER_GENERAL_SETTINGS);
    }
}

export const SettingsInstaller = createImplementation({
    abstraction: AppInstaller,
    implementation: SettingsInstallerImpl,
    dependencies: [KeyValueStore]
});

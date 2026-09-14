import { ServiceDiscovery } from "@webiny/api-core/features/serviceDiscovery/index.js";
import { createImplementation } from "@webiny/feature/api";
import { AppInstaller } from "@webiny/api-core/features/tenancy/InstallTenant/index.js";
import { FILE_MANAGER_GENERAL_SETTINGS } from "~/domain/settings/constants.js";
import { UpdateSettingsUseCase } from "~/features/settings/UpdateSettings/abstractions.js";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { BuildParams } from "@webiny/api-core/features/buildParams/index.js";
import { RequestOrigin } from "@webiny/api-core/features/requestContext/index.js";

class SettingsInstallerImpl implements AppInstaller.Interface {
    readonly alwaysRun = true;
    readonly appName = "FileManager";
    readonly dependsOn = [];

    constructor(
        private updateSettings: UpdateSettingsUseCase.Interface,
        private keyValueStore: KeyValueStore.Interface,
        private buildParams: BuildParams.Interface,
        private requestOrigin: RequestOrigin.Interface
    ) {}

    async install(): Promise<void> {
        // TODO: move this to api-core with a proper abstraction
        const manifest = await ServiceDiscovery.load();

        // If no records in the database, `manifest` object is empty POJO.
        // That's why the heavy `?.` usage.
        //
        // The AWS hosting type serves files from a CloudFront domain (in the manifest). The self-hosted
        // (server) hosting type has no CloudFront — files are served by the api's own `/files/*` route — so
        // fall back to the configured API origin, read from the WEBINY_API_URL build param (baked by
        // Infra.ApiUrl), not a process.env read. Failing that, the origin this install request came
        // through, which covers a proxy whose address wasn't knowable when the api was built.
        //
        // Note this value is PERSISTED into editable settings, and `alwaysRun` only means "include
        // this installer whenever an install is requested" — not "run on every boot". So this is the
        // initial value, not a value that tracks the origin: a project whose API origin changes later
        // (e.g. moving behind the dev proxy) keeps the old prefix until someone updates the setting.
        // Deliberately not self-healing, since the setting is also where a CDN origin would be set.
        const domain =
            manifest?.api?.cloudfront?.domain ??
            this.buildParams.get<string>("WEBINY_API_URL") ??
            this.requestOrigin.get() ??
            "";

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
    dependencies: [UpdateSettingsUseCase, KeyValueStore, BuildParams, RequestOrigin]
});

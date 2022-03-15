import { SettingsStorageOperations } from "./SettingsStorageOperations";
import {
    SettingsStorageOperationsProviderPlugin,
    SettingsStorageOperationsProviderPluginParams
} from "@webiny/api-file-manager/plugins/definitions/SettingsStorageOperationsProviderPlugin";

export class SettingsStorageOperationsProviderDdbPlugin extends SettingsStorageOperationsProviderPlugin {
    public override name = "fm.storageOperationsProvider.settings.ddb";

    public async provide({ context }: SettingsStorageOperationsProviderPluginParams) {
        return new SettingsStorageOperations({
            context
        });
    }
}

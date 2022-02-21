import { SettingsStorageOperations } from "./SettingsStorageOperations";
import {
    SettingsStorageOperationsProviderPlugin,
    SettingsStorageOperationsProviderPluginParams
} from "@webiny/api-file-manager/plugins/definitions/SettingsStorageOperationsProviderPlugin";

export class SettingsStorageOperationsProviderDdbEsPlugin extends SettingsStorageOperationsProviderPlugin {
    public name = "fm.storageOperationsProvider.settings.ddb.es";
    async provide({ context }: SettingsStorageOperationsProviderPluginParams) {
        return new SettingsStorageOperations({
            context
        });
    }
}

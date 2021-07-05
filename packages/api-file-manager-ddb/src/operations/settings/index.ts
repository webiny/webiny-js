import { SettingsStorageOperations } from "./SettingsStorageOperations";
import { SettingsStorageOperationsProviderPlugin } from "@webiny/api-file-manager/plugins/definitions/SettingsStorageOperationsProviderPlugin";

export class SettingsStorageOperationsProviderDdbPlugin extends SettingsStorageOperationsProviderPlugin {
    public name = "fm.storageOperationsProvider.settings.ddb";
    async provide({ context }) {
        return new SettingsStorageOperations({
            context
        });
    }
}

import { SettingsStorageOperations } from "./SettingsStorageOperations";
import { SettingsStorageOperationsProviderPlugin } from "@webiny/api-file-manager/plugins/definitions";

class SettingsStorageOperationsProviderDdbEsPlugin extends SettingsStorageOperationsProviderPlugin {
    public name = "fm.storageOperationsProvider.settings.ddb.es";
    async provide({ context }) {
        return new SettingsStorageOperations({
            context
        });
    }
}

export default new SettingsStorageOperationsProviderDdbEsPlugin();

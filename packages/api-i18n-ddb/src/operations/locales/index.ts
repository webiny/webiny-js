import { LocalesStorageOperations } from "./LocalesStorageOperations";
import { LocalesStorageOperationsProviderPlugin } from "@webiny/api-i18n/plugins/LocalesStorageOperationsProviderPlugin";

export class LocalesStorageOperationsProviderDdbPlugin extends LocalesStorageOperationsProviderPlugin {
    public name = "i18n.storageOperationsProvider.settings.ddb";
    async provide({ context }) {
        return new LocalesStorageOperations({
            context
        });
    }
}

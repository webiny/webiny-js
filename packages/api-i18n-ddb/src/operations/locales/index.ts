import { LocalesStorageOperations } from "./LocalesStorageOperations";
import {
    LocalesStorageOperationsProviderPlugin,
    Params
} from "@webiny/api-i18n/plugins/LocalesStorageOperationsProviderPlugin";
import fields from "./fields";

export class LocalesStorageOperationsProviderDdbPlugin extends LocalesStorageOperationsProviderPlugin {
    public name = "i18n.storageOperationsProvider.settings.ddb";
    async provide({ context }: Params) {
        context.plugins.register(fields());

        return new LocalesStorageOperations({
            context
        });
    }
}

import { LocalesStorageOperations } from "./LocalesStorageOperations";
import {
    LocalesStorageOperationsProviderPlugin,
    LocalesStorageOperationsProviderPluginParams
} from "@webiny/api-i18n/plugins/LocalesStorageOperationsProviderPlugin";
import fields from "./fields";

export class LocalesStorageOperationsProviderDdbPlugin extends LocalesStorageOperationsProviderPlugin {
    public override name = "i18n.storageOperationsProvider.settings.ddb";
    public async provide({ context }: LocalesStorageOperationsProviderPluginParams) {
        context.plugins.register(fields());

        return new LocalesStorageOperations({
            context
        });
    }
}

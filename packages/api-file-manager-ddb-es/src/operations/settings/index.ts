import { SettingsStorageOperations } from "./SettingsStorageOperations";
import {
    SettingsStorageOperationsProviderPlugin,
    SettingsStorageOperationsProviderPluginParams
} from "@webiny/api-file-manager/plugins/definitions/SettingsStorageOperationsProviderPlugin";
import { FileManagerContext } from "~/types";

export class SettingsStorageOperationsProviderDdbEsPlugin extends SettingsStorageOperationsProviderPlugin {
    public override name = "fm.storageOperationsProvider.settings.ddb.es";
    public async provide({
        context
    }: SettingsStorageOperationsProviderPluginParams<FileManagerContext>) {
        return new SettingsStorageOperations({
            context
        });
    }
}

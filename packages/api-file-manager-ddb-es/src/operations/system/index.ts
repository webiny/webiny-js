import { SystemStorageOperations } from "./SystemStorageOperations";
import {
    SystemStorageOperationsProviderPlugin,
    SystemStorageOperationsProviderPluginParams
} from "@webiny/api-file-manager/plugins/definitions/SystemStorageOperationsProviderPlugin";
import { FileManagerContext } from "~/types";

export class SystemStorageOperationsProviderDdbEsPlugin extends SystemStorageOperationsProviderPlugin {
    public override name = "fm.storageOperationsProvider.system.ddb.es";
    public async provide({
        context
    }: SystemStorageOperationsProviderPluginParams<FileManagerContext>) {
        return new SystemStorageOperations({
            context
        });
    }
}

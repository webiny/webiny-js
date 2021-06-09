import {FileManagerSystemStorageOperationsProviderPlugin} from "@webiny/api-file-manager/types";
import {FileManagerSystemStorageOperationsDdbEs} from "~/operations/system/FileManagerSystemStorageOperationsDdbEs";
import {FileManagerInstallationPlugin} from "~/operations/system/FileManagerInstallationPlugin";

export default (): FileManagerSystemStorageOperationsProviderPlugin => ({
    type: "fm.storageOperationsProvider.system",
    name: "fm.storageOperationsProvider.system.ddb.es",
    async provide({context}) {
        
        context.plugins.register(new FileManagerInstallationPlugin());
        
        return new FileManagerSystemStorageOperationsDdbEs({
            context,
        })
    },
})
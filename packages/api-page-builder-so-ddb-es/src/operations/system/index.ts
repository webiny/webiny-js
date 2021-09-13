import {
    Params,
    SystemStorageOperationsProviderPlugin
} from "@webiny/api-page-builder/plugins/SystemStorageOperationsProviderPlugin";
import { SystemStorageOperations } from "@webiny/api-page-builder/types";
import { SystemStorageOperationsDdbEs } from "./SystemStorageOperations";
import { installation } from "~/operations/system/InstallationDdbEsPlugin";

export class SystemStorageOperationsDdbEsProviderPlugin extends SystemStorageOperationsProviderPlugin {
    public async provide({ context }: Params): Promise<SystemStorageOperations> {
        /**
         * We need the installation plugin to insert the page builder elasticsearch index on before install.
         */
        context.plugins.register([installation()]);

        return new SystemStorageOperationsDdbEs({
            context
        });
    }
}

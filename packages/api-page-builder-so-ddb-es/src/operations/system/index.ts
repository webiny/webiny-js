import { SystemStorageOperationsProviderPlugin } from "@webiny/api-page-builder/plugins/SystemStorageOperationsProviderPlugin";
import { SystemStorageOperations } from "@webiny/api-page-builder/types";
import { SystemStorageOperationsDdbEs } from "./SystemStorageOperations";

export class SystemStorageOperationsDdbEsProviderPlugin extends SystemStorageOperationsProviderPlugin {
    public async provide({ context }): Promise<SystemStorageOperations> {
        return new SystemStorageOperationsDdbEs({
            context
        });
    }
}

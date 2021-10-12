import {
    Params,
    SystemStorageOperationsProviderPlugin
} from "@webiny/api-page-builder/plugins/SystemStorageOperationsProviderPlugin";
import { SystemStorageOperations } from "@webiny/api-page-builder/types";
import { SystemStorageOperationsDdb } from "./SystemStorageOperations";

export class SystemStorageOperationsDdbProviderPlugin extends SystemStorageOperationsProviderPlugin {
    public async provide({ context }: Params): Promise<SystemStorageOperations> {
        return new SystemStorageOperationsDdb({
            context
        });
    }
}

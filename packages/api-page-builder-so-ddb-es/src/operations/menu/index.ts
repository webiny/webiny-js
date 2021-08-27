import { MenuStorageOperationsProviderPlugin } from "@webiny/api-page-builder/plugins/MenuStorageOperationsProviderPlugin";
import { MenuStorageOperations } from "@webiny/api-page-builder/types";
import { MenuStorageOperationsDdbEs } from "./MenuStorageOperations";

export class MenuStorageOperationsDdbEsProviderPlugin extends MenuStorageOperationsProviderPlugin {
    public async provide({ context }): Promise<MenuStorageOperations> {
        return new MenuStorageOperationsDdbEs({ context });
    }
}

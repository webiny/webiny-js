import { MenuStorageOperationsProviderPlugin } from "@webiny/api-page-builder/plugins/MenuStorageOperationsProviderPlugin";
import { MenuStorageOperations } from "@webiny/api-page-builder/types";
import { MenuStorageOperationsDdb } from "./MenuStorageOperations";

export class MenuStorageOperationsDdbProviderPlugin extends MenuStorageOperationsProviderPlugin {
    public async provide({ context }): Promise<MenuStorageOperations> {
        return new MenuStorageOperationsDdb({ context });
    }
}

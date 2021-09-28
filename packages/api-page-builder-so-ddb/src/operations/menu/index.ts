import {
    MenuStorageOperationsProviderPlugin,
    Params
} from "@webiny/api-page-builder/plugins/MenuStorageOperationsProviderPlugin";
import { MenuStorageOperations } from "@webiny/api-page-builder/types";
import { MenuStorageOperationsDdb } from "./MenuStorageOperations";
import fields from "./fields";

export class MenuStorageOperationsDdbProviderPlugin extends MenuStorageOperationsProviderPlugin {
    public async provide({ context }: Params): Promise<MenuStorageOperations> {
        context.plugins.register(fields());

        return new MenuStorageOperationsDdb({ context });
    }
}

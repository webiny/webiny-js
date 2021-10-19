import {
    MenuStorageOperationsProviderPlugin,
    Params
} from "@webiny/api-page-builder/plugins/MenuStorageOperationsProviderPlugin";
import { MenuStorageOperations } from "@webiny/api-page-builder/types";
import { MenuStorageOperationsDdbEs } from "./MenuStorageOperations";
import fields from "./fields";

export class MenuStorageOperationsDdbEsProviderPlugin extends MenuStorageOperationsProviderPlugin {
    public async provide({ context }: Params): Promise<MenuStorageOperations> {
        context.plugins.register(fields());

        return new MenuStorageOperationsDdbEs({ context });
    }
}

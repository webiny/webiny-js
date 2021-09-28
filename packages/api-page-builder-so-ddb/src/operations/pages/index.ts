import {
    Params,
    PageStorageOperationsProviderPlugin
} from "@webiny/api-page-builder/plugins/PageStorageOperationsProviderPlugin";
import { PageStorageOperations } from "@webiny/api-page-builder/types";
import { PageStorageOperationsDdb } from "./PageStorageOperations";
import fields from "./fields";

export class PageStorageOperationsDdbProviderPlugin extends PageStorageOperationsProviderPlugin {
    public async provide({ context }: Params): Promise<PageStorageOperations> {
        context.plugins.register(fields());

        return new PageStorageOperationsDdb({
            context
        });
    }
}

import {
    PageElementStorageOperationsProviderPlugin,
    Params
} from "@webiny/api-page-builder/plugins/PageElementStorageOperationsProviderPlugin";
import { PageElementStorageOperations } from "@webiny/api-page-builder/types";
import { PageElementStorageOperationsDdb } from "./PageElementStorageOperations";
import fields from "./fields";

export class PageElementStorageOperationsDdbProviderPlugin extends PageElementStorageOperationsProviderPlugin {
    public async provide({ context }: Params): Promise<PageElementStorageOperations> {
        context.plugins.register(fields());

        return new PageElementStorageOperationsDdb({
            context
        });
    }
}

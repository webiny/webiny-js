import { PageElementStorageOperationsProviderPlugin } from "@webiny/api-page-builder/plugins/PageElementStorageOperationsProviderPlugin";
import { PageElementStorageOperations } from "@webiny/api-page-builder/types";
import { PageElementStorageOperationsDdb } from "./PageElementStorageOperations";

export class PageElementStorageOperationsDdbProviderPlugin extends PageElementStorageOperationsProviderPlugin {
    public async provide({ context }): Promise<PageElementStorageOperations> {
        return new PageElementStorageOperationsDdb({
            context
        });
    }
}

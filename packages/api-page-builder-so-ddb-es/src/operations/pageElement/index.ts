import { PageElementStorageOperationsProviderPlugin } from "@webiny/api-page-builder/plugins/PageElementStorageOperationsProviderPlugin";
import { PageElementStorageOperations } from "@webiny/api-page-builder/types";
import { PageElementStorageOperationsDdbEs } from "./PageElementStorageOperations";

export class PageElementStorageOperationsDdbEsProvider extends PageElementStorageOperationsProviderPlugin {
    public async provide({ context }): Promise<PageElementStorageOperations> {
        return new PageElementStorageOperationsDdbEs({
            context
        });
    }
}

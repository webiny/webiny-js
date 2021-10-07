import { PageElementStorageOperationsProviderPlugin } from "@webiny/api-page-builder/plugins/PageElementStorageOperationsProviderPlugin";
import { PageElementStorageOperations } from "@webiny/api-page-builder/types";
import { PageElementStorageOperationsDdbEs } from "./PageElementStorageOperations";
import fields from "./fields";

export class PageElementStorageOperationsDdbEsProviderPlugin extends PageElementStorageOperationsProviderPlugin {
    public async provide({ context }): Promise<PageElementStorageOperations> {
        context.plugins.register(fields());

        return new PageElementStorageOperationsDdbEs({
            context
        });
    }
}

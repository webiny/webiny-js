import { CategoryStorageOperationsProviderPlugin } from "@webiny/api-page-builder/plugins/CategoryStorageOperationsProviderPlugin";
import { CategoryStorageOperations } from "@webiny/api-page-builder/types";
import { CategoryStorageOperationsDdbEs } from "./CategoryStorageOperations";

export class CategoryStorageOperationsDdbEsProviderPlugin extends CategoryStorageOperationsProviderPlugin {
    public async provide({ context }): Promise<CategoryStorageOperations> {
        return new CategoryStorageOperationsDdbEs({ context });
    }
}

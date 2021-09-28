import {
    CategoryStorageOperationsProviderPlugin,
    Params
} from "@webiny/api-page-builder/plugins/CategoryStorageOperationsProviderPlugin";
import { CategoryStorageOperations } from "@webiny/api-page-builder/types";
import { CategoryStorageOperationsDdb } from "./CategoryStorageOperations";
import fields from "./fields";

export class CategoryStorageOperationsDdbProviderPlugin extends CategoryStorageOperationsProviderPlugin {
    public async provide({ context }: Params): Promise<CategoryStorageOperations> {
        context.plugins.register(fields());

        return new CategoryStorageOperationsDdb({ context });
    }
}

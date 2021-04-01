import CmsContentModelGroupCrudDynamoElastic from "./CmsContentModelGroupCrudDynamoElastic";
import { CmsContentModelGroupStorageOperationsProvider } from "@webiny/api-headless-cms/types";
import { createBasePrimaryKey } from "../../utils";

const contentModelGroupStorageOperationsProvider = (): CmsContentModelGroupStorageOperationsProvider => ({
    type: "cms-content-model-group-storage-operations-provider",
    name: "cms-content-model-group-storage-operations-ddb-es-crud",
    provide: async ({ context }) => {
        const basePrimaryKey = createBasePrimaryKey(context);
        return new CmsContentModelGroupCrudDynamoElastic({
            context,
            basePrimaryKey
        });
    }
});

export default contentModelGroupStorageOperationsProvider;

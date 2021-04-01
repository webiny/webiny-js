import CmsContentModelCrudDynamoElastic from "./CmsContentModelCrudDynamoElastic";
import { CmsContentModelStorageOperationsProvider } from "@webiny/api-headless-cms/types";
import { createBasePrimaryKey } from "../../utils";

const contentModelStorageOperationsProvider = (): CmsContentModelStorageOperationsProvider => ({
    type: "cms-content-model-storage-operations-provider",
    name: "cms-content-model-storage-operations-ddb-es-crud",
    provide: async ({ context }) => {
        const basePrimaryKey = createBasePrimaryKey(context);
        return new CmsContentModelCrudDynamoElastic({
            context,
            basePrimaryKey
        });
    }
});

export default contentModelStorageOperationsProvider;

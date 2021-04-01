import CmsContentModelDynamoElastic from "./CmsContentModelDynamoElastic";
import { CmsContentModelStorageOperationsProvider } from "@webiny/api-headless-cms/types";
import { createBasePrimaryKey } from "../../utils";

const contentModelStorageOperationsProvider = (): CmsContentModelStorageOperationsProvider => ({
    type: "cms-content-model-storage-operations-provider",
    name: "cms-content-model-storage-operations-ddb-es-crud",
    provide: async ({ context }) => {
        const basePrimaryKey = createBasePrimaryKey(context);
        return new CmsContentModelDynamoElastic({
            context,
            basePrimaryKey
        });
    }
});

export default contentModelStorageOperationsProvider;

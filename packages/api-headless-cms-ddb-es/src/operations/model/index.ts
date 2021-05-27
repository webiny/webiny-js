import CmsContentModelDynamoElastic from "./CmsContentModelDynamoElastic";
import { CmsContentModelStorageOperationsProvider } from "@webiny/api-headless-cms/types";

const contentModelStorageOperationsProvider = (): CmsContentModelStorageOperationsProvider => ({
    type: "cms-content-model-storage-operations-provider",
    name: "cms-content-model-storage-operations-ddb-es-crud",
    provide: async ({ context }) => {
        return new CmsContentModelDynamoElastic({
            context
        });
    }
});

export default contentModelStorageOperationsProvider;

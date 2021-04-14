import CmsContentModelGroupDynamoElastic from "./CmsContentModelGroupDynamoElastic";
import { CmsContentModelGroupStorageOperationsProvider } from "@webiny/api-headless-cms/types";

const contentModelGroupStorageOperationsProvider = (): CmsContentModelGroupStorageOperationsProvider => ({
    type: "cms-content-model-group-storage-operations-provider",
    name: "cms-content-model-group-storage-operations-ddb-es-crud",
    provide: async ({ context }) => {
        return new CmsContentModelGroupDynamoElastic({
            context
        });
    }
});

export default contentModelGroupStorageOperationsProvider;

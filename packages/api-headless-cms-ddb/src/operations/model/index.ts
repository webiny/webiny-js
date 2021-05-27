import CmsContentModelDynamo from "./CmsContentModelDynamo";
import { CmsContentModelStorageOperationsProvider } from "@webiny/api-headless-cms/types";

const contentModelStorageOperationsProvider = (): CmsContentModelStorageOperationsProvider => ({
    type: "cms-content-model-storage-operations-provider",
    name: "cms-content-model-storage-operations-ddb-crud",
    provide: async ({ context }) => {
        return new CmsContentModelDynamo({
            context
        });
    }
});

export default contentModelStorageOperationsProvider;

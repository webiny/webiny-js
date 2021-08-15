import CmsContentModelGroupDynamo from "./CmsContentModelGroupDynamo";
import { CmsContentModelGroupStorageOperationsProvider } from "@webiny/api-headless-cms/types";

const contentModelGroupStorageOperationsProvider =
    (): CmsContentModelGroupStorageOperationsProvider => ({
        type: "cms-content-model-group-storage-operations-provider",
        name: "cms-content-model-group-storage-operations-ddb-crud",
        provide: async ({ context }) => {
            return new CmsContentModelGroupDynamo({
                context
            });
        }
    });

export default contentModelGroupStorageOperationsProvider;

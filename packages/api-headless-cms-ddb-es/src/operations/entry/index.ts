import CmsContentEntryDynamoElastic from "./CmsContentEntryDynamoElastic";
import { CmsContentEntryStorageOperationsProvider } from "@webiny/api-headless-cms/types";

const contentEntryStorageOperationsProvider = (): CmsContentEntryStorageOperationsProvider => ({
    type: "cms-content-entry-storage-operations-provider",
    name: "cms-content-entry-storage-operations-ddb-es-crud",
    provide: async ({ context }) => {
        return new CmsContentEntryDynamoElastic({
            context
        });
    }
});

export default contentEntryStorageOperationsProvider;

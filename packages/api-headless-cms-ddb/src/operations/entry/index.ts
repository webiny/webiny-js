import CmsContentEntryDynamo from "./CmsContentEntryDynamo";
import { CmsContentEntryStorageOperationsProvider } from "@webiny/api-headless-cms/types";

const contentEntryStorageOperationsProvider = (): CmsContentEntryStorageOperationsProvider => ({
    type: "cms-content-entry-storage-operations-provider",
    name: "cms-content-entry-storage-operations-ddb-crud",
    provide: async ({ context }) => {
        return new CmsContentEntryDynamo({
            context
        });
    }
});

export default contentEntryStorageOperationsProvider;
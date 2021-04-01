import CmsContentEntryDynamoElastic from "./CmsContentEntryDynamoElastic";
import { CmsContentEntryStorageOperationsProvider } from "@webiny/api-headless-cms/types";
import { createBasePrimaryKey } from "../../utils";

const contentEntryStorageOperationsProvider = (): CmsContentEntryStorageOperationsProvider => ({
    type: "cms-content-entry-storage-operations-provider",
    name: "cms-content-entry-storage-operations-ddb-es-crud",
    provide: async ({ context }) => {
        const basePrimaryKey = createBasePrimaryKey(context);
        return new CmsContentEntryDynamoElastic({
            context,
            basePrimaryKey
        });
    }
});

export default contentEntryStorageOperationsProvider;

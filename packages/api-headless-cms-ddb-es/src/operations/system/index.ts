import CmsSystemDynamoElastic from "./CmsSystemDynamoElastic";
import { CmsSystemStorageOperationsProviderPlugin } from "@webiny/api-headless-cms/types";

export default (): CmsSystemStorageOperationsProviderPlugin => ({
    type: "cms-system-storage-operations-provider",
    name: "cms-system-storage-operations-ddb-es-crud",
    provide: async ({ context }) => {
        return new CmsSystemDynamoElastic({
            context
        });
    }
});

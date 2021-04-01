import CmsSystemDynamoElastic from "./CmsSystemDynamoElastic";
import { CmsSystemStorageOperationsProviderPlugin } from "@webiny/api-headless-cms/types";
import { createBasePrimaryKey } from "../../utils";

export default (): CmsSystemStorageOperationsProviderPlugin => ({
    type: "cms-system-storage-operations-provider",
    name: "cms-system-storage-operations-ddb-es-crud",
    provide: async ({ context }) => {
        const basePrimaryKey = createBasePrimaryKey(context);
        return new CmsSystemDynamoElastic({
            context,
            basePrimaryKey
        });
    }
});

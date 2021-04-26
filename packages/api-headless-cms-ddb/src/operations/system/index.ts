import CmsSystemDynamo from "./CmsSystemDynamo";
import { CmsSystemStorageOperationsProviderPlugin } from "@webiny/api-headless-cms/types";

export default (): CmsSystemStorageOperationsProviderPlugin => ({
    type: "cms-system-storage-operations-provider",
    name: "cms-system-storage-operations-ddb-crud",
    provide: async ({ context }) => {
        return new CmsSystemDynamo({
            context
        });
    }
});

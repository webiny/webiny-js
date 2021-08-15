import CmsSystemDynamoElastic from "./CmsSystemDynamoElastic";
import { CmsSystemStorageOperationsProviderPlugin } from "@webiny/api-headless-cms/types";
import { CmsSystemInstallationPlugin } from "./CmsSystemInstallationPlugin";

export default (): CmsSystemStorageOperationsProviderPlugin => ({
    type: "cms-system-storage-operations-provider",
    name: "cms-system-storage-operations-ddb-es-crud",
    provide: async ({ context }) => {
        // Hook into the installation
        context.plugins.register(new CmsSystemInstallationPlugin());

        return new CmsSystemDynamoElastic({
            context
        });
    }
});

import CmsSettingsDynamoElastic from "./CmsSettingsDynamoElastic";
import { CmsSettingsStorageOperationsProviderPlugin } from "@webiny/api-headless-cms/types";
import { createBasePrimaryKey } from "../../utils";

export default (): CmsSettingsStorageOperationsProviderPlugin => ({
    type: "cms-settings-storage-operations-provider",
    name: "cms-settings-storage-operations-ddb-es-crud",
    provide: async ({ context }) => {
        const basePrimaryKey = createBasePrimaryKey(context);
        return new CmsSettingsDynamoElastic({
            context,
            basePrimaryKey
        });
    }
});

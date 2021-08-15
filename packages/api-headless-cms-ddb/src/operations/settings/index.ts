import CmsSettingsDynamo from "./CmsSettingsDynamo";
import { CmsSettingsStorageOperationsProviderPlugin } from "@webiny/api-headless-cms/types";

export default (): CmsSettingsStorageOperationsProviderPlugin => ({
    type: "cms-settings-storage-operations-provider",
    name: "cms-settings-storage-operations-ddb-crud",
    provide: async ({ context }) => {
        return new CmsSettingsDynamo({
            context
        });
    }
});

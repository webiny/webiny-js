import { SettingsStorageOperationsProviderPlugin } from "@webiny/api-page-builder/plugins/SettingsStorageOperationsProviderPlugin";
import { SettingsStorageOperations } from "@webiny/api-page-builder/types";
import { SettingsStorageOperationsDdb } from "./SettingsStorageOperations";

export class SettingsStorageOperationsDdbProviderPlugin extends SettingsStorageOperationsProviderPlugin {
    public async provide({ context }): Promise<SettingsStorageOperations> {
        return new SettingsStorageOperationsDdb({
            context
        });
    }
}

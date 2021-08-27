import { SettingsStorageOperationsProviderPlugin } from "@webiny/api-page-builder/plugins/SettingsStorageOperationsProviderPlugin";
import { SettingsStorageOperations } from "@webiny/api-page-builder/types";
import { SettingsStorageOperationsDdbEs } from "./SettingsStorageOperations";

export class SettingsStorageOperationsDdbEsProviderPlugin extends SettingsStorageOperationsProviderPlugin {
    public async provide({ context }): Promise<SettingsStorageOperations> {
        return new SettingsStorageOperationsDdbEs({
            context
        });
    }
}

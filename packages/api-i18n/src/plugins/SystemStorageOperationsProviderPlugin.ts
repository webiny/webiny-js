import { Plugin } from "@webiny/plugins";
import { I18NContext, I18NSystemStorageOperations } from "~/types";

export interface SystemStorageOperationsProviderPluginParams {
    context: I18NContext;
}

export abstract class SystemStorageOperationsProviderPlugin extends Plugin {
    public static override readonly type: string = "i18n.storageOperationsProvider.system";

    public abstract provide(
        params: SystemStorageOperationsProviderPluginParams
    ): Promise<I18NSystemStorageOperations>;
}

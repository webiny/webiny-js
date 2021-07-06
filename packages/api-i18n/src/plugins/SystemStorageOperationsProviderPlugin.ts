import { Plugin } from "@webiny/plugins";
import { I18NContext, I18NSystemStorageOperations } from "~/types";

export interface Params {
    context: I18NContext;
}

export abstract class SystemStorageOperationsProviderPlugin extends Plugin {
    public static readonly type = "i18n.storageOperationsProvider.system";

    public abstract provide(params: Params): Promise<I18NSystemStorageOperations>;
}

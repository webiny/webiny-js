import {Plugin} from "@webiny/plugins";
import {I18NContext} from "~/types";

export interface Params {
    context: I18NContext;
}

export abstract class SystemStorageOperationsProviderPlugin<T> extends Plugin {
    public static readonly type = "i18n.storageOperationsProvider.system";
    
    public abstract provide(params: Params): Promise<T>;
}

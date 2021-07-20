import { Plugin } from "@webiny/plugins";
import { I18NContext, I18NLocalesStorageOperations } from "~/types";

export interface Params {
    context: I18NContext;
}

export abstract class LocalesStorageOperationsProviderPlugin extends Plugin {
    public static readonly type = "i18n.storageOperationsProvider.locales";

    public abstract provide(params: Params): Promise<I18NLocalesStorageOperations>;
}

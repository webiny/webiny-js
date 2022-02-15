import { Plugin } from "@webiny/plugins/Plugin";

export type LocaleKeys = "default" | "content";
export interface I18NLocaleContextPluginParams {
    context: {
        name: LocaleKeys;
    };
}
export class I18NLocaleContextPlugin extends Plugin {
    public static readonly type: string = "i18n-locale-context";

    private readonly params: I18NLocaleContextPluginParams;

    public get context(): I18NLocaleContextPluginParams["context"] {
        return this.params.context;
    }

    public constructor(params: I18NLocaleContextPluginParams) {
        super();
        this.params = params;
    }
}

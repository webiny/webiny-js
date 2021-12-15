import { Plugin } from "@webiny/plugins/Plugin";

export interface Params {
    context: {
        name: string;
    };
}
export class I18NLocaleContextPlugin extends Plugin {
    public static readonly type: string = "i18n-locale-context";

    private readonly params: Params;

    public get context(): Params["context"] {
        return this.params.context;
    }

    public constructor(params: Params) {
        super();
        this.params = params;
    }
}

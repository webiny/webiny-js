import { Plugin } from "@webiny/plugins";
import { Page, PbContext } from "~/types";

export type CallbackFunction<TParams> = (params: TParams) => void | Promise<void>;

export interface NotFoundParams {
    context: PbContext;
    args: Record<string, any>;
}

interface Config<TPage extends Page = Page> {
    notFound?: (params: NotFoundParams) => Promise<TPage | undefined>;
}

export class PagePlugin<TPage extends Page = Page> extends Plugin {
    public static readonly type = "pb.page";
    private readonly _config: Config<TPage>;

    constructor(config?: Config<TPage>) {
        super();
        this._config = config || {};
    }

    notFound(params: NotFoundParams): Promise<Page | undefined> {
        return this._execute("notFound", params);
    }

    private _execute(callback, params) {
        if (typeof this._config[callback] === "function") {
            return this._config[callback](params);
        }
    }
}

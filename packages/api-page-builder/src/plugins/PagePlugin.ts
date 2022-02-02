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

    notFound(params: NotFoundParams): Promise<TPage | undefined> {
        return this._execute("notFound", params);
    }

    private async _execute(
        callback: keyof Config,
        params: NotFoundParams
    ): Promise<TPage | undefined> {
        if (typeof this._config[callback] !== "function") {
            return undefined;
        }
        return this._config[callback](params);
    }
}

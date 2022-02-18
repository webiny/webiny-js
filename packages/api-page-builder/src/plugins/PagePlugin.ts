import { Plugin } from "@webiny/plugins";
import { Page, PbContext } from "~/types";

export type CallbackFunction<TParams> = (params: TParams) => void | Promise<void>;

interface Args {
    [key: string]: any;
}
export interface NotFoundParams<T = any> {
    context: PbContext;
    args: Args & T;
}

interface Config<TPage extends Page = Page> {
    notFound?: (params: NotFoundParams) => Promise<TPage | null>;
}

export class PagePlugin<TPage extends Page = Page> extends Plugin {
    public static readonly type = "pb.page";
    private readonly _config: Config<TPage>;

    constructor(config?: Config<TPage>) {
        super();
        this._config = config || {};
    }

    public async notFound<T = Args>(params: NotFoundParams<T>): Promise<TPage | null> {
        return this._execute("notFound", params);
    }

    private async _execute(callback: keyof Config, params: NotFoundParams): Promise<TPage | null> {
        const cb = this._config[callback];
        if (typeof cb !== "function") {
            return null;
        }
        return cb(params);
    }
}

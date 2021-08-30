import { Plugin } from "@webiny/plugins";
import { Settings, Page, PageSpecialType, PbContext } from "~/types";

export type CallbackFunction<TParams> = (params: TParams) => void | Promise<void>;

interface UpdateParams {
    context: PbContext;
    previousSettings: Settings;
    nextSettings: Settings;
    meta: {
        diff: {
            pages: Array<[PageSpecialType, string, string, Page]>;
        };
    };
}

interface Config {
    beforeUpdate?: CallbackFunction<UpdateParams>;
    afterUpdate?: CallbackFunction<UpdateParams>;
}

export class SettingsPlugin extends Plugin {
    public static readonly type = "pb.settings";
    private _config: Partial<Config>;

    constructor(config?: Config) {
        super();
        this._config = config || {};
    }

    beforeUpdate(params: UpdateParams): void | Promise<void> {
        return this._execute("beforeUpdate", params);
    }

    afterUpdate(params: UpdateParams): void | Promise<void> {
        return this._execute("afterUpdate", params);
    }

    private _execute(callback, params) {
        if (typeof this._config[callback] === "function") {
            return this._config[callback](params);
        }
    }
}

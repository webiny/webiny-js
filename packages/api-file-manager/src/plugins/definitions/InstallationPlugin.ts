import { FileManagerContext } from "~/types";
import { Plugin } from "@webiny/plugins";

export type CallbackFunction<TParams> = (params: TParams) => Promise<void>;

export interface Params {
    context: FileManagerContext;
}

interface Config {
    beforeInstall?: CallbackFunction<Params>;
    afterInstall?: CallbackFunction<Params>;
}

export abstract class InstallationPlugin extends Plugin {
    public static readonly type = "fm.install";
    private readonly _config: Partial<Config>;

    constructor(config?: Partial<Config>) {
        super();
        this._config = config || {};
    }

    public async beforeInstall(params: Params): Promise<void> {
        return this._execute("beforeInstall", params);
    }

    public async afterInstall(params: Params): Promise<void> {
        return this._execute("afterInstall", params);
    }

    private async _execute(callback, params): Promise<void> {
        if (typeof this._config[callback] !== "function") {
            return;
        }
        return this._config[callback](params);
    }
}

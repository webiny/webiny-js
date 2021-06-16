import { Plugin } from "@webiny/plugins";
import { CmsContext } from "~/types";

export type CallbackFunction<TParams> = (params: TParams) => void | Promise<void>;

interface InstallationParams {
    context: CmsContext;
}

interface Config {
    beforeInstall?: CallbackFunction<InstallationParams>;
    afterInstall?: CallbackFunction<InstallationParams>;
}

export class InstallationPlugin extends Plugin {
    public static readonly type = "cms.install";
    private _config: Partial<Config>;

    constructor(config?: Config) {
        super();
        this._config = config || {};
    }

    beforeInstall(params: InstallationParams): void | Promise<void> {
        return this._execute("beforeInstall", params);
    }

    afterInstall(params: InstallationParams): void | Promise<void> {
        return this._execute("afterInstall", params);
    }

    private _execute(callback, params) {
        if (typeof this._config[callback] === "function") {
            return this._config[callback](params);
        }
    }
}

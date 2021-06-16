import { Plugin } from "@webiny/plugins";
import { PbContext } from "~/types";

export type CallbackFunction<TParams> = (params: TParams) => void | Promise<void>;

interface InstallationParams {
    context: PbContext;
}

interface Config {
    beforeInstall?: CallbackFunction<InstallationParams>;
    afterInstall?: CallbackFunction<InstallationParams>;
}

export class InstallationPlugin extends Plugin {
    public static readonly type = "pb.install";
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

import { FileManagerContext } from "~/types";
import { Plugin } from "@webiny/plugins";

export interface InstallationPluginParams {
    context: FileManagerContext;
}
export type CallbackFunction<TParams> = (params: TParams) => Promise<void>;

interface InstallationPluginConfig {
    beforeInstall?: CallbackFunction<InstallationPluginParams>;
    afterInstall?: CallbackFunction<InstallationPluginParams>;
}

export abstract class InstallationPlugin extends Plugin {
    public static readonly type = "fm.install";
    private readonly _config: Partial<InstallationPluginConfig>;

    constructor(config?: Partial<InstallationPluginConfig>) {
        super();
        this._config = config || {};
    }

    public async beforeInstall(params: InstallationPluginParams): Promise<void> {
        return this._execute("beforeInstall", params);
    }

    public async afterInstall(params: InstallationPluginParams): Promise<void> {
        return this._execute("afterInstall", params);
    }

    private async _execute(
        callback: keyof InstallationPluginConfig,
        params: InstallationPluginParams
    ): Promise<void> {
        if (typeof this._config[callback] !== "function") {
            return;
        }
        return this._config[callback](params);
    }
}

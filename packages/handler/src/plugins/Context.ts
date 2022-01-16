import { Context as ContextInterface, HandlerArgs } from "~/types";
import { PluginsContainer } from "@webiny/plugins";

export interface ContextParams {
    args: HandlerArgs;
    plugins?: Plugin | Plugin[] | Plugin[][] | PluginsContainer;
    WEBINY_VERSION: string;
}
export class Context implements ContextInterface {
    public _result: any;
    private readonly _plugins: PluginsContainer;
    private readonly _args: HandlerArgs;
    private readonly _version: string;

    public get plugins(): PluginsContainer {
        return this._plugins;
    }

    public get args(): HandlerArgs {
        return this._args;
    }

    public get WEBINY_VERSION(): string {
        return this._version;
    }

    public constructor(params: ContextParams) {
        const { plugins, args, WEBINY_VERSION } = params;
        this._plugins = new PluginsContainer(plugins || []);
        this._args = args;
        this._version = WEBINY_VERSION;
    }

    public getResult(): any {
        return this._result;
    }

    public hasResult(): boolean {
        return !!this._result;
    }

    public setResult(value: any): void {
        this._result = value;
    }
}

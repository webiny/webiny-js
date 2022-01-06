import { Context as ContextInterface, HandlerArgs } from "~/types";
import { PluginsContainer } from "@webiny/plugins";

export interface Params {
    args?: HandlerArgs;
    plugins?: Plugin | Plugin[] | Plugin[][] | PluginsContainer;
    WEBINY_VERSION: string;
}
export class Context implements ContextInterface {
    public _result: any;
    public readonly plugins: PluginsContainer;
    private readonly _args: HandlerArgs;
    private readonly _version: string;

    public get args(): HandlerArgs {
        return this._args;
    }

    public get WEBINY_VERSION(): string {
        return this._version;
    }

    public constructor(params: Params) {
        const { plugins, args, WEBINY_VERSION } = params;
        this.plugins = new PluginsContainer(plugins || []);
        this._args = args || [];
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

    public waitFor(
        obj: string | string[],
        cb: <T extends ContextInterface = ContextInterface>(context: T) => void
    ): void {
        const targets = Array.isArray(obj) ? obj : [obj];
        for (const target of targets) {
            if (!this[target]) {
                Object.defineProperty(this, target, {
                    set: value => {
                        this[target] = value;
                        cb(this);
                    }
                });
                continue;
            }
            cb(this);
        }
    }
}

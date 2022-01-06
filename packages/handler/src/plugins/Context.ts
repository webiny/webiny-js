import { Context as ContextInterface, HandlerArgs } from "~/types";
import { PluginsContainer } from "@webiny/plugins";

interface Waiter {
    targets: string[];
    cb: (context: ContextInterface) => void;
}

export interface Params {
    args?: HandlerArgs;
    plugins?: Plugin | Plugin[] | Plugin[][] | PluginsContainer;
    WEBINY_VERSION: string;
}
export class Context implements ContextInterface {
    public _result: any;
    public readonly plugins: PluginsContainer;
    public readonly args: HandlerArgs;
    public readonly WEBINY_VERSION: string;

    private readonly waiters: Waiter[] = [];

    public constructor(params: Params) {
        const { plugins, args, WEBINY_VERSION } = params;
        this.plugins = new PluginsContainer(plugins || []);
        this.args = args || [];
        this.WEBINY_VERSION = WEBINY_VERSION;
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

    public waitFor<T extends ContextInterface = ContextInterface>(
        obj: string | string[],
        cb: (context: T) => void
    ): void {
        const initialTargets = Array.isArray(obj) ? obj : [obj];
        const targets: string[] = [];
        for (const target of initialTargets) {
            if (this[target]) {
                continue;
            }
            Object.defineProperty(this, target, {
                set: value => {
                    this[`__${target}__`] = value;
                    for (const waiter of this.waiters) {
                        if (waiter.targets.includes(target) === false) {
                            continue;
                        }
                        waiter.targets = waiter.targets.filter(t => t !== target);
                        if (waiter.targets.length > 0) {
                            continue;
                        }
                        waiter.cb(this);
                    }
                },
                get: () => {
                    return this[`__${target}__`];
                },
                configurable: true
            });
            targets.push(target);
        }
        if (targets.length === 0) {
            cb(this as any);
            return;
        }
        this.waiters.push({
            targets,
            cb
        });
    }
}

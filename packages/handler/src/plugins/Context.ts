import { Context as ContextInterface, HandlerArgs } from "~/types";
import { PluginsContainer } from "@webiny/plugins";
import { PluginCollection } from "@webiny/plugins/types";

interface Waiter {
    targets: string[];
    cb: (context: ContextInterface) => void;
}

export interface ContextParams {
    args?: HandlerArgs;
    plugins?: PluginCollection;
    WEBINY_VERSION: string;
}
export class Context implements ContextInterface {
    public _result: any;
    public readonly plugins: PluginsContainer;
    public readonly args: HandlerArgs;
    public readonly WEBINY_VERSION: string;

    private readonly waiters: Waiter[] = [];

    public constructor(params: ContextParams) {
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
        /**
         * We go only through the first level properties
         */
        for (const key in initialTargets) {
            const target = initialTargets[key] as keyof this;
            /**
             * If property already exists, there is no need to wait for it, so we just continue the loop.
             * Also, if target is not a string, skip this property as it will fail to convert properly during the runtime.
             */
            if (this[target]) {
                continue;
            } else if (typeof target !== "string") {
                continue;
            }
            /**
             * Since there is no property, we must define it with its setter and getter.
             * We could not know when it got defined otherwise.
             */
            Object.defineProperty(this, target, {
                /**
                 * Setter sets the given value to this object.
                 * We cannot set it on exact property name it is defined because it would go into loop of setting itself.
                 * And that is why we add __ around the property name.
                 */
                set: (value: any) => {
                    const newTargetKey = `__${target}__` as keyof this;
                    this[newTargetKey] = value;
                    /**
                     * WWhen the property is set, we will go through all the waiters and, if any of them include currently set property, act on it.
                     */
                    for (const waiter of this.waiters) {
                        if (waiter.targets.includes(target) === false) {
                            continue;
                        }
                        /**
                         * Remove currently set property so we know if there are any more to be waited for.
                         */
                        waiter.targets = waiter.targets.filter(t => t !== target);
                        /**
                         * If there are more to be waited, eg. user added [cms, pageBuilder] as waited properties, we just continue the loop.
                         */
                        if (waiter.targets.length > 0) {
                            continue;
                        }
                        /**
                         * And if there is nothing more to be waited for, we execute the callable.
                         * Note that this callable is not async.
                         */
                        waiter.cb(this);
                    }
                },
                /**
                 * As we have set property with __ around it, we must get it as well.
                 */
                get: (): any => {
                    const newTargetKey = `__${target}__` as keyof this;
                    return this[newTargetKey];
                },
                configurable: false
            });
            /**
             * We add the target to be awaited.
             */
            targets.push(target as string);
        }
        /**
         * If there are no targets to be awaited, just fire the callable.
         */
        if (targets.length === 0) {
            cb(this as any);
            return;
        }
        /**
         * Otherwise add the waiter for the target properties.
         */
        this.waiters.push({
            targets,
            /**
             * TODO @ts-refactor
             * Problem with possible subtype initialization
             */
            // @ts-ignore
            cb
        });
    }
}

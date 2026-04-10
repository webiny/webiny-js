import { Plugin } from "@webiny/plugins";
import type { Context } from "~/types.js";

export interface IRegisterExtensionPluginCb<C extends Context = Context> {
    (context: C): Promise<void> | void;
}

export class RegisterExtensionPlugin<C extends Context = Context> extends Plugin {
    public static override readonly type: string = "handler.register.extension";

    public constructor(private readonly cb: IRegisterExtensionPluginCb<C>) {
        super();
    }

    public apply(context: C): Promise<void> | void {
        return this.cb(context);
    }
}

export const createRegisterExtensionPlugin = <C extends Context = Context>(
    cb: IRegisterExtensionPluginCb<C>
) => {
    return new RegisterExtensionPlugin<C>(cb);
};

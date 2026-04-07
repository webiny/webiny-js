import { Plugin } from "@webiny/plugins";
import type { Container } from "@webiny/di";
import type { Context } from "~/Context.js";

export interface IRegisterExtensionPluginCb {
    (context: Pick<Context, "container">): void;
}

export class RegisterExtensionPlugin extends Plugin {
    public static override readonly type: string = "handler.register.extension";

    public constructor(private readonly cb: IRegisterExtensionPluginCb) {
        super();
    }

    public apply(container: Container): void {
        this.cb({ container });
    }
}

export const createRegisterExtensionPlugin = (cb: IRegisterExtensionPluginCb) => {
    return new RegisterExtensionPlugin(cb);
};

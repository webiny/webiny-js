import { Plugin } from "@webiny/plugins";
import type { Container } from "@webiny/di";
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

/**
 * Apply RegisterExtensionPlugins at register() time — synchronously with the request container,
 * BEFORE any RequestContextInitializer runs. Each plugin's callback only does DI registration via
 * registerExtension(ctx.container, ...) (feature/decorator/registration), which is register-time
 * safe. Doing this early is important for code-defined CMS models (ModelFactory): a later
 * initializer (e.g. ACO) lists + caches the model set per request, so any model registered after
 * that — as happened when extensions ran via the post-auth initializer — was silently missing.
 */
export async function registerExtensions(
    container: Container,
    plugins: unknown | unknown[]
): Promise<void> {
    const flat = [plugins].flat(Infinity as 1).filter(Boolean) as RegisterExtensionPlugin[];
    for (const plugin of flat) {
        if (plugin?.type === RegisterExtensionPlugin.type && typeof plugin.apply === "function") {
            await plugin.apply({ container } as unknown as Context);
        }
    }
}

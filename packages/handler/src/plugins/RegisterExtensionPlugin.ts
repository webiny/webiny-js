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
 * BEFORE anything lists the model set. Each plugin's callback only does DI registration via
 * registerExtension(ctx.container, ...) (feature/decorator/registration), which is register-time
 * safe. Doing this early is important for code-defined CMS models (ModelFactory): the first
 * request-time listing (e.g. the ACO folder schema) caches the model set for the rest of the
 * request, so any model registered after that point is silently missing.
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

/**
 * Registers a BuildParam. A separate type from RegisterExtensionPlugin so the request stack can apply
 * build params BEFORE any feature registers: features gate themselves on FeatureFlags (a BuildParam)
 * at register() time, and would otherwise read an empty flag set. `registerExtensions` skips these.
 */
export class RegisterBuildParamPlugin<
    C extends Context = Context
> extends RegisterExtensionPlugin<C> {
    public static override readonly type: string = "handler.register.buildParam";
}

export const createRegisterBuildParamPlugin = <C extends Context = Context>(
    cb: IRegisterExtensionPluginCb<C>
) => {
    return new RegisterBuildParamPlugin<C>(cb);
};

/**
 * Apply RegisterBuildParamPlugins. Call this before registering any feature that reads BuildParams
 * (e.g. FeatureFlags) at register() time.
 */
export async function registerBuildParams(
    container: Container,
    plugins: unknown | unknown[]
): Promise<void> {
    const flat = [plugins].flat(Infinity as 1).filter(Boolean) as RegisterBuildParamPlugin[];
    for (const plugin of flat) {
        if (plugin?.type === RegisterBuildParamPlugin.type && typeof plugin.apply === "function") {
            await plugin.apply({ container } as unknown as Context);
        }
    }
}

import { ApplicationHook } from "./ApplicationConfig";

export function mergeHooks(
    ...hooks: (ApplicationHook | undefined | null)[]
): ApplicationHook | undefined {
    hooks = hooks.filter(Boolean);

    if (!hooks.length) {
        return undefined;
    }

    if (hooks.length === 1) {
        return hooks[0];
    }

    const hook: ApplicationHook = async (params, context) => {
        for (const h of hooks) {
            await h(params, context);
        }
    };

    return hook;
}

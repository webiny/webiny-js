import { ApplicationHook } from "~/ApplicationHook";

export function mergeAppHooks(
    ...hooks: (ApplicationHook | undefined | null)[]
): ApplicationHook | undefined {
    hooks = hooks.filter(Boolean) as ApplicationHook[];

    if (!hooks.length) {
        return undefined;
    }

    return async (params, context) => {
        for (const hook of hooks) {
            await hook(params, context);
        }
    };
}

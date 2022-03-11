import { ApplicationHook } from "~/ApplicationHook";

export function mergeAppHooks(
    ...hooks: (ApplicationHook | undefined | null)[]
): ApplicationHook | undefined {
    const filtered = hooks.filter(Boolean) as ApplicationHook[];

    if (!hooks.length) {
        return undefined;
    }

    return async (params, context) => {
        for (const hook of filtered) {
            await hook(params, context);
        }
    };
}

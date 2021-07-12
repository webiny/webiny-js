import { LocalePlugin } from "~/plugins/LocalePlugin";
import { I18NContext } from "~/types";

export const runLifecycleEvent = async (
    hook: string,
    params: { context: I18NContext; plugins: LocalePlugin[] } & Record<string, any>
): Promise<void> => {
    const { plugins, ...rest } = params;
    if (plugins.length === 0) {
        return;
    }
    for (const plugin of plugins) {
        if (!plugin[hook]) {
            continue;
        }
        await plugin[hook](rest);
    }
};

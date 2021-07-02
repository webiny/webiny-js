import { FilePlugin } from "~/plugins/definitions/FilePlugin";
import { FileManagerContext } from "~/types";

export const runLifecycleEvent = async (
    hook: string,
    params: { context: FileManagerContext; plugins: FilePlugin[] } & Record<string, any>
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

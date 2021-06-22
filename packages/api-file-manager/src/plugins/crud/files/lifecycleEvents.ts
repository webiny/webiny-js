import { FilePlugin } from "~/plugins/definitions";

export const runLifecycleEvent = async (
    hook: string,
    params: { plugins: FilePlugin[] } & Record<string, any>
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

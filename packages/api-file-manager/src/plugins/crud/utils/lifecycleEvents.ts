// TODO @ts-refactor introduce pubsub methods
import { FilePlugin, FilePluginParams } from "~/plugins/definitions/FilePlugin";
import { FileManagerContext } from "~/types";

export const runLifecycleEvent = async (
    hook: keyof FilePluginParams,
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
        /**
         * Keep any because we do not know which hook needs to be executed. This will be removed, so it does not matter.
         */
        await plugin[hook](rest as any);
    }
};

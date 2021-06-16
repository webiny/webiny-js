import { Plugin } from "@webiny/plugins/types";

type CallbackFallback = (args: any) => void | Promise<void>;

export default async <TCallbackFunction extends CallbackFallback = CallbackFallback>(
    plugins: Plugin[],
    hook: string,
    args: Parameters<TCallbackFunction>[0]
) => {
    for (const plugin of plugins) {
        if (typeof plugin[hook] === "function") {
            await plugin[hook](args);
        }
    }
};

import type { IStorerAfterEachPluginCanHandleParams } from "~/resolver/plugins/StorerAfterEachPlugin.js";

export const shouldBeHandled = (params: IStorerAfterEachPluginCanHandleParams): boolean => {
    const { item, table } = params;
    if (table.type !== "regular") {
        return false;
    } else if (item.SK !== "L") {
        return false;
    }
    // TODO use constant from fileManager
    else if (item.modelId !== "fmFile") {
        return false;
    } else if (!item.values) {
        return false;
    }

    // @ts-expect-error
    const key = item.values["text@key"] || item.values["key"];
    if (!key) {
        return false;
    }
    /**
     * We can check length for being more than 2 characters,
     * because we know that the key is a string.
     */
    return typeof key === "string" && key.length > 2;
};

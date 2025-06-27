import type { IStorerAfterEachPluginCanHandleParams } from "~/resolver/plugins/StorerAfterEachPlugin.js";

export const shouldBeHandled = (params: IStorerAfterEachPluginCanHandleParams): boolean => {
    const { item, table } = params;
    if (table.type !== "regular") {
        return false;
    } else if (item.SK !== "L") {
        return false;
    }
    // TODO use constant from api-file-manager
    return item.modelId === "fmFile" && !!item.values;
};

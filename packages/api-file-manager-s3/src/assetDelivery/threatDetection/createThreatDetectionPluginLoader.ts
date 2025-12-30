import type { PluginFactory } from "@webiny/plugins/types.js";
import { createConditionalPluginFactory } from "@webiny/api";

export const createThreatDetectionPluginLoader = (cb: PluginFactory) => {
    return createConditionalPluginFactory(
        () => process.env.WBY_FUNCTION_TYPE === "threat-detection-event-handler",
        cb
    );
};

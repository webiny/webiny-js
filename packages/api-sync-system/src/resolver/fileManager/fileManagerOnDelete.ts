import { createStorerAfterEachPluginWithName } from "~/resolver/plugins/StorerAfterEachPlugin.js";
import { shouldBeHandled } from "~/resolver/fileManager/shouldBeHandled.js";
import type { DeleteCommandOutput } from "@webiny/aws-sdk/client-dynamodb/index.js";

export const createFileManagerOnDeletePlugin = () => {
    return createStorerAfterEachPluginWithName<DeleteCommandOutput>("fileManager.onDelete", {
        canHandle: params => {
            const { command } = params;
            if (command !== "delete") {
                return false;
            }
            return shouldBeHandled(params);
        },
        handle: async params => {}
    });
};

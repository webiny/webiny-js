import { createContextPlugin } from "@webiny/api";
import { EmptyTrashBinTaskDefinition } from "./EmptyTrashBinTaskDefinition.js";

export const createEmptyTrashBinsTask = () => {
    return createContextPlugin(context => {
        context.container.register(EmptyTrashBinTaskDefinition);
    });
};

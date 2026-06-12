import {
    createEmptyTrashBinsTask,
    createHcmsBulkActions
} from "@webiny/api-headless-cms-bulk-actions";
import { createContextPlugin } from "@webiny/api";
import { DeleteModelTaskFeature } from "~/features/DeleteModelTask/feature.js";
import { createDeleteModelCrud } from "~/graphql/deleteModel/crud.js";
import { createDeleteModelGraphQl } from "~/graphql/deleteModel/index.js";

export const createDeleteModelTask = () => {
    return [
        createDeleteModelCrud(),
        createDeleteModelGraphQl(),
        createContextPlugin(context => {
            DeleteModelTaskFeature.register(context.container);
        })
    ];
};

export const createHcmsTasks = () => [
    createHcmsBulkActions({ batchSize: 100 }),
    createEmptyTrashBinsTask(),
    createDeleteModelTask()
];
export { HcmsTasksFeature } from "./HcmsTasksFeature.js";

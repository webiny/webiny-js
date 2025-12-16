import {
    createEmptyTrashBinsTask,
    createHcmsBulkActions
} from "@webiny/api-headless-cms-bulk-actions";
import { createHeadlessCmsImportExport } from "@webiny/api-headless-cms-import-export";
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
    createHcmsBulkActions(),
    createEmptyTrashBinsTask(),
    createHeadlessCmsImportExport(),
    createDeleteModelTask()
];

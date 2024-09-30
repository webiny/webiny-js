import { createTaskDefinition } from "@webiny/tasks";
import { EXPORT_CONTENT_ENTRIES_CONTROLLER_TASK } from "./constants";
import type { Context } from "~/types";
import type {
    IExportContentEntriesControllerInput,
    IExportContentEntriesControllerOutput
} from "~/tasks/domain/abstractions/ExportContentEntriesController";

export const createExportContentEntriesControllerTask = () => {
    return createTaskDefinition<
        Context,
        IExportContentEntriesControllerInput,
        IExportContentEntriesControllerOutput
    >({
        id: EXPORT_CONTENT_ENTRIES_CONTROLLER_TASK,
        title: "Export Content Entries and Assets Controller",
        maxIterations: 100,
        isPrivate: true,
        description: "Export content entries and assets from a specific model - controller.",
        async run(params) {
            const { ExportContentEntriesController } = await import(
                /* webpackChunkName: "ExportContentEntriesController" */ "./domain/ExportContentEntriesController"
            );

            try {
                const controller = new ExportContentEntriesController();
                return await controller.run(params);
            } catch (ex) {
                return params.response.error(ex);
            }
        }
    });
};

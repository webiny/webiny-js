import { createTaskDefinition } from "@webiny/tasks";
import { EXPORT_CONTENT_ENTRIES_TASK } from "./constants";
import { Context } from "~/types";
import {
    IExportContentEntriesInput,
    IExportContentEntriesOutput
} from "~/tasks/domain/abstractions/ExportContentEntries";

export const createExportContentEntriesTask = () => {
    return createTaskDefinition<Context, IExportContentEntriesInput, IExportContentEntriesOutput>({
        id: EXPORT_CONTENT_ENTRIES_TASK,
        title: "Export Content Entries",
        maxIterations: 100,
        isPrivate: true,
        description: "Export content entries from a specific model.",
        async run(params) {
            const { ExportContentEntries } = await import(
                /* webpackChunkName: "ExportContentEntries" */ "./domain/ExportContentEntries"
            );

            const exportContentEntries = new ExportContentEntries();

            try {
                return await exportContentEntries.run(params);
            } catch (ex) {
                return params.response.error(ex);
            }
        }
    });
};

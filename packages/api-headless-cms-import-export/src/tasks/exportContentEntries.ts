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
        maxIterations: 20,
        isPrivate: true,
        description: "Export content entries from a specific model.",
        async run(params) {
            const { createExportContentEntries } = await import(
                /* webpackChunkName: "createExportContentEntries" */ "./domain/createExportContentEntries"
            );

            const runner = createExportContentEntries();

            try {
                return await runner.run(params);
            } catch (ex) {
                return params.response.error(ex);
            }
        }
    });
};

import { IMPORT_FROM_URL_PROCESS_ENTRIES_TASK } from "~/tasks/constants";
import { createTaskDefinition } from "@webiny/tasks";
import type { Context } from "~/types";
import type {
    IImportFromUrlProcessEntriesInput,
    IImportFromUrlProcessEntriesOutput
} from "./domain/importFromUrlProcessEntries/abstractions/ImportFromUrlProcessEntries";

export const createImportFromUrlProcessEntriesTask = () => {
    return createTaskDefinition<
        Context,
        IImportFromUrlProcessEntriesInput,
        IImportFromUrlProcessEntriesOutput
    >({
        id: IMPORT_FROM_URL_PROCESS_ENTRIES_TASK,
        title: "Import from URL List - Process entries",
        maxIterations: 500,
        isPrivate: true,
        description: "Process entries import.",
        async run(params) {
            const { createImportFromUrlProcessEntries } = await import(
                /* webpackChunkName: "createImportFromUrlProcessEntries" */ "./domain/createImportFromUrlProcessEntries"
            );

            try {
                const runner = createImportFromUrlProcessEntries();
                return await runner.run(params);
            } catch (ex) {
                return params.response.error(ex);
            }
        }
    });
};

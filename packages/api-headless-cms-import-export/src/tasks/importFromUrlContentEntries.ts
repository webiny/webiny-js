import { IMPORT_FROM_URL_CONTENT_ENTRIES_TASK } from "~/tasks/constants";
import { createTaskDefinition } from "@webiny/tasks";
import { Context } from "~/types";
import {
    IImportFromUrlContentEntriesInput,
    IImportFromUrlContentEntriesOutput
} from "~/tasks/domain/abstractions/ImportFromUrlContentEntries";

export const createImportFromUrlContentEntriesTask = () => {
    return createTaskDefinition<
        Context,
        IImportFromUrlContentEntriesInput,
        IImportFromUrlContentEntriesOutput
    >({
        id: IMPORT_FROM_URL_CONTENT_ENTRIES_TASK,
        title: "Import from URL List - Content Entries.",
        maxIterations: 500,
        isPrivate: true,
        description: "Imports the data from the given URL list - content entries.",
        async run(params) {
            const { ImportFromUrlContentEntries } = await import(
                /* webpackChunkName: "ImportFromUrlContentEntries" */ "./domain/ImportFromUrlContentEntries"
            );

            try {
                const runner = new ImportFromUrlContentEntries();
                return await runner.run(params);
            } catch (ex) {
                return params.response.error(ex);
            }
        }
    });
};

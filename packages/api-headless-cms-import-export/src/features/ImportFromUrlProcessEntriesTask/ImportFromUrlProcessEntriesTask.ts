import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { CmsContext } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { IMPORT_FROM_URL_PROCESS_ENTRIES_TASK } from "~/tasks/constants.js";
import type { Context } from "~/types.js";
import type {
    IImportFromUrlProcessEntriesInput,
    IImportFromUrlProcessEntriesOutput
} from "./importFromUrlProcessEntries/abstractions/ImportFromUrlProcessEntries.js";

type IRunParams = TaskDefinition.RunParams<
    IImportFromUrlProcessEntriesInput,
    IImportFromUrlProcessEntriesOutput
>;

class ImportFromUrlProcessEntriesTaskDefinition implements TaskDefinition.Interface<
    IImportFromUrlProcessEntriesInput,
    IImportFromUrlProcessEntriesOutput
> {
    id = IMPORT_FROM_URL_PROCESS_ENTRIES_TASK;
    title = "Import from URL List - Process entries";
    maxIterations = 500;
    isPrivate = true;
    description = "Process entries import.";

    selfCleanup = ["onSuccess" as const, "onAbort" as const];

    constructor(private context: CmsContext.Interface) {}

    async run(params: IRunParams) {
        const { createImportFromUrlProcessEntries } =
            await import("./createImportFromUrlProcessEntries.js");

        try {
            const runner = createImportFromUrlProcessEntries(this.context as Context);
            return await runner.run(params);
        } catch (ex) {
            return params.controller.response.error(ex);
        }
    }
}

export const ImportFromUrlProcessEntriesTask = TaskDefinition.createImplementation({
    implementation: ImportFromUrlProcessEntriesTaskDefinition,
    dependencies: [CmsContext]
});

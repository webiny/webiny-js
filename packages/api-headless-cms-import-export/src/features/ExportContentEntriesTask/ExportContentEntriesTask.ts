import type {
    IExportContentEntriesInput,
    IExportContentEntriesOutput
} from "~/tasks/domain/abstractions/ExportContentEntries.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { CmsContext } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import type { Context } from "~/types.js";
import { EXPORT_CONTENT_ENTRIES_TASK } from "~/tasks/constants.js";

type IRunParams = TaskDefinition.RunParams<IExportContentEntriesInput, IExportContentEntriesOutput>;

class ExportContentEntriesTaskDefinition
    implements TaskDefinition.Interface<IExportContentEntriesInput, IExportContentEntriesOutput>
{
    id = EXPORT_CONTENT_ENTRIES_TASK;
    title = "Export Content Entries";
    maxIterations = 50;
    isPrivate = true;
    description = "Export content entries from a specific model.";

    constructor(private context: Context) {}

    async run(params: IRunParams) {
        const { createExportContentEntries } = await import(
            /* webpackChunkName: "createExportContentEntries" */ "./createExportContentEntries.js"
        );

        try {
            const runner = createExportContentEntries(this.context);
            return await runner.run(params);
        } catch (ex) {
            return params.controller.response.error(ex);
        }
    }
}

export const ExportContentEntriesTask = TaskDefinition.createImplementation({
    implementation: ExportContentEntriesTaskDefinition,
    dependencies: [CmsContext]
});

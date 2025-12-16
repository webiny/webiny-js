import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { CmsContext } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { IMPORT_FROM_URL_PROCESS_ASSETS_TASK } from "~/tasks/constants.js";
import type { Context } from "~/types.js";
import type {
    IImportFromUrlProcessAssetsInput,
    IImportFromUrlProcessAssetsOutput
} from "./importFromUrlProcessAssets/abstractions/ImportFromUrlProcessAssets.js";

type IRunParams = TaskDefinition.RunParams<
    IImportFromUrlProcessAssetsInput,
    IImportFromUrlProcessAssetsOutput
>;

class ImportFromUrlProcessAssetsTaskDefinition
    implements
        TaskDefinition.Interface<
            IImportFromUrlProcessAssetsInput,
            IImportFromUrlProcessAssetsOutput
        >
{
    id = IMPORT_FROM_URL_PROCESS_ASSETS_TASK;
    title = "Import from URL List - Process entries";
    maxIterations = 10;
    isPrivate = true;
    description = "Process entries import.";

    constructor(private context: CmsContext.Interface) {}

    async run(params: IRunParams) {
        const { createImportFromUrlProcessAssets } = await import(
            "./createImportFromUrlProcessAssets.js"
        );

        try {
            const runner = createImportFromUrlProcessAssets(this.context as Context);
            return await runner.run(params);
        } catch (ex) {
            return params.controller.response.error(ex);
        }
    }
}

export const ImportFromUrlProcessAssetsTask = TaskDefinition.createImplementation({
    implementation: ImportFromUrlProcessAssetsTaskDefinition,
    dependencies: [CmsContext]
});

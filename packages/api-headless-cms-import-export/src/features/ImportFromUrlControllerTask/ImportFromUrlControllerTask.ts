import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { IMPORT_FROM_URL_CONTROLLER_TASK } from "~/tasks/constants.js";
import type { Context } from "~/types.js";
import type {
    IImportFromUrlControllerInput,
    IImportFromUrlControllerOutput
} from "~/tasks/domain/abstractions/ImportFromUrlController.js";
import { CmsContext } from "@webiny/api-headless-cms/features/shared/abstractions.js";

type IRunParams = TaskDefinition.RunParams<
    IImportFromUrlControllerInput,
    IImportFromUrlControllerOutput
>;

class ImportFromUrlControllerTaskDefinition implements TaskDefinition.Interface<
    IImportFromUrlControllerInput,
    IImportFromUrlControllerOutput
> {
    id = IMPORT_FROM_URL_CONTROLLER_TASK;
    title = "Import from URL List - Controller";
    maxIterations = 500;
    isPrivate = true;
    description = "Imports the data from the given URL list - controller.";

    constructor(private context: CmsContext.Interface) {}

    async run(params: IRunParams) {
        const { ImportFromUrlController } = await import("./ImportFromUrlController.js");

        try {
            const runner = new ImportFromUrlController(this.context as Context);
            return await runner.run(params);
        } catch (ex) {
            return params.controller.response.error(ex);
        }
    }

    async onDone({
        task
    }: TaskDefinition.LifecycleHookParams<
        IImportFromUrlControllerInput,
        IImportFromUrlControllerOutput
    >) {
        const { createDeleteFiles } = await import("./deleteFiles/DeleteFiles.js");

        const deleteFiles = createDeleteFiles();

        await deleteFiles.execute(task.output?.files);
    }
}

export const ImportFromUrlControllerTask = TaskDefinition.createImplementation({
    implementation: ImportFromUrlControllerTaskDefinition,
    dependencies: [CmsContext]
});

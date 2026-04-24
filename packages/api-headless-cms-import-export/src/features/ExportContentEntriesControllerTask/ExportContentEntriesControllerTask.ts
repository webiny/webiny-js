import type * as Controller from "~/tasks/domain/abstractions/ExportContentEntriesController.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { CmsContext } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import type { Context } from "~/types.js";
import { EXPORT_CONTENT_ENTRIES_CONTROLLER_TASK } from "~/tasks/constants.js";

type IRunParams = TaskDefinition.RunParams<
    Controller.IControllerInput,
    Controller.IControllerOutput
>;

class ExportContentEntriesControllerTaskDefinition implements TaskDefinition.Interface<
    Controller.IControllerInput,
    Controller.IControllerOutput
> {
    id = EXPORT_CONTENT_ENTRIES_CONTROLLER_TASK;
    title = "Export Content Entries and Assets Controller";
    maxIterations = 100;
    isPrivate = true;
    description = "Export content entries and assets from a specific model - controller.";

    constructor(private context: CmsContext.Interface) {}

    async run(params: IRunParams) {
        const { ExportContentEntriesController } = await import(
            /* webpackChunkName: "ExportContentEntriesController" */ "./ExportContentEntriesController.js"
        );

        try {
            const controller = new ExportContentEntriesController(this.context as Context);
            return await controller.run(params);
        } catch (ex) {
            return params.controller.response.error(ex);
        }
    }
}

export const ExportContentEntriesControllerTask = TaskDefinition.createImplementation({
    implementation: ExportContentEntriesControllerTaskDefinition,
    dependencies: [CmsContext]
});

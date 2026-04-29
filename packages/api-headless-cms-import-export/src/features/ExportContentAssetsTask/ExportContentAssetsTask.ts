import type {
    IExportContentAssetsInput,
    IExportContentAssetsOutput
} from "~/tasks/domain/abstractions/ExportContentAssets.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { CmsContext } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import type { Context } from "~/types.js";
import { EXPORT_CONTENT_ASSETS_TASK } from "~/tasks/constants.js";

type IRunParams = TaskDefinition.RunParams<IExportContentAssetsInput, IExportContentAssetsOutput>;

class ExportContentAssetsTaskDefinition implements TaskDefinition.Interface<
    IExportContentAssetsInput,
    IExportContentAssetsOutput
> {
    id = EXPORT_CONTENT_ASSETS_TASK;
    title = "Export Content Assets";
    maxIterations = 50;
    isPrivate = true;
    description = "Export content assets from a specific model.";

    selfCleanup = ["onSuccess" as const, "onAbort" as const];

    constructor(private context: CmsContext.Interface) {}

    async run(params: IRunParams) {
        const { createExportContentAssets } = await import(
            /* webpackChunkName: "createExportContentAssets" */ "./createExportContentAssets.js"
        );

        try {
            const runner = createExportContentAssets(this.context as Context);
            return await runner.run(params);
        } catch (ex) {
            return params.controller.response.error(ex);
        }
    }
}

export const ExportContentAssetsTask = TaskDefinition.createImplementation({
    implementation: ExportContentAssetsTaskDefinition,
    dependencies: [CmsContext]
});

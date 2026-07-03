import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { GetRevisionByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetRevisionById/index.js";
import { WorkflowStateContextProvider } from "@webiny/api-workflows/features/workflowState/CreateWorkflowState/index.js";
import { getModelIdFromAppName } from "~/utils/appName.js";
import type { GenericRecord } from "@webiny/api/types.js";

class CmsWorkflowStateContextProviderImpl implements WorkflowStateContextProvider.Interface {
    constructor(
        private getModel: GetModelUseCase.Interface,
        private getRevisionById: GetRevisionByIdUseCase.Interface,
        private decoratee: WorkflowStateContextProvider.Interface
    ) {}

    async provide(params: WorkflowStateContextProvider.Params): Promise<GenericRecord> {
        const modelId = getModelIdFromAppName(params.app);
        if (!modelId) {
            return this.decoratee.provide(params);
        }

        const modelResult = await this.getModel.execute(modelId);
        if (modelResult.isFail()) {
            return {};
        }

        const model = modelResult.value;
        const entryResult = await this.getRevisionById.execute(model, params.targetRevisionId);

        if (entryResult.isFail()) {
            return {};
        }

        const entry = entryResult.value;

        return {
            folderId: entry.location?.folderId || null,
            modelId
        };
    }
}

export const CmsWorkflowStateContextProvider = WorkflowStateContextProvider.createDecorator({
    decorator: CmsWorkflowStateContextProviderImpl,
    dependencies: [GetModelUseCase, GetRevisionByIdUseCase]
});

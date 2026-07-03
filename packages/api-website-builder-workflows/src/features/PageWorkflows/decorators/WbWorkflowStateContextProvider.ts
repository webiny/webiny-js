import { GetPageByIdUseCase } from "@webiny/api-website-builder/features/pages/GetPageById/index.js";
import { WorkflowStateContextProvider } from "@webiny/api-workflows/features/workflowState/CreateWorkflowState/index.js";
import { WB_PAGE_APP } from "~/utils/appName.js";
import type { GenericRecord } from "@webiny/api/types.js";

class WbWorkflowStateContextProviderImpl implements WorkflowStateContextProvider.Interface {
    constructor(
        private getPageById: GetPageByIdUseCase.Interface,
        private decoratee: WorkflowStateContextProvider.Interface
    ) {}

    async provide(params: WorkflowStateContextProvider.Params): Promise<GenericRecord> {
        if (params.app !== WB_PAGE_APP) {
            return this.decoratee.provide(params);
        }

        const pageResult = await this.getPageById.execute(params.targetRevisionId);

        if (pageResult.isFail()) {
            return {};
        }

        const page = pageResult.value;

        return {
            folderId: page.location?.folderId || null
        };
    }
}

export const WbWorkflowStateContextProvider = WorkflowStateContextProvider.createDecorator({
    decorator: WbWorkflowStateContextProviderImpl,
    dependencies: [GetPageByIdUseCase]
});

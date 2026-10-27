import { Result } from "@webiny/feature/api";
import { CurrentReviewViewer } from "@webiny/api-workflows/features/identity/CurrentReviewViewer/index.js";
import { ListWorkflowsUseCase } from "@webiny/api-workflows/features/workflow/ListWorkflows/index.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";
import { isWbWorkflow } from "../shared/wbWorkflows.js";
import { ListWebsiteBuilderPageWorkflowsUseCase as UseCase } from "./abstractions.js";

/** v1 binds one workflow per model (D15); a few extra cover the accepted save race (D41). */
const LIMIT = 10;

class ListWebsiteBuilderPageWorkflowsUseCaseImpl implements UseCase.Interface {
    public constructor(
        private viewer: CurrentReviewViewer.Interface,
        private listWorkflows: ListWorkflowsUseCase.Interface
    ) {}

    public async execute(): UseCase.Return {
        const actor = this.viewer.getActor();
        if (actor.isFail()) {
            return Result.fail(actor.error);
        }

        const listed = await this.listWorkflows.execute({
            where: { models_in: [WB_PAGE_NAMESPACE] },
            limit: LIMIT
        });
        if (listed.isFail()) {
            return Result.fail(listed.error);
        }
        return Result.ok(listed.value.items.filter(isWbWorkflow));
    }
}

export const ListWebsiteBuilderPageWorkflowsUseCase = UseCase.createImplementation({
    implementation: ListWebsiteBuilderPageWorkflowsUseCaseImpl,
    dependencies: [CurrentReviewViewer, ListWorkflowsUseCase]
});

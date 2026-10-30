import { Result } from "@webiny/feature/api";
import { CurrentReviewViewer } from "@webiny/api-workflows/features/identity/CurrentReviewViewer/index.js";
import { GetWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetWorkflow/index.js";
import { WorkflowNotFoundError } from "@webiny/api-workflows/domain/workflow/errors.js";
import { isCmsWorkflow } from "../shared/cmsWorkflows.js";
import { GetCmsEntryWorkflowUseCase as UseCase } from "./abstractions.js";

class GetCmsEntryWorkflowUseCaseImpl implements UseCase.Interface {
    public constructor(
        private viewer: CurrentReviewViewer.Interface,
        private getWorkflow: GetWorkflowUseCase.Interface
    ) {}

    public async execute(input: UseCase.Input): UseCase.Return {
        const actor = this.viewer.getActor();
        if (actor.isFail()) {
            return Result.fail(actor.error);
        }

        const workflow = await this.getWorkflow.execute({ id: input.id });
        if (workflow.isFail()) {
            return Result.fail(workflow.error);
        }
        if (!isCmsWorkflow(workflow.value)) {
            return Result.fail(new WorkflowNotFoundError({ id: input.id }));
        }
        return Result.ok(workflow.value);
    }
}

export const GetCmsEntryWorkflowUseCase = UseCase.createImplementation({
    implementation: GetCmsEntryWorkflowUseCaseImpl,
    dependencies: [CurrentReviewViewer, GetWorkflowUseCase]
});

import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import type { EditorWorkflow } from "~/editor/domain/types.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import { WorkflowEditorRepository } from "~/editor/repository/abstractions.js";
import { ReviewRepository } from "~/review/repository/abstractions.js";
import { DeleteWorkflowUseCase as UseCaseAbstraction } from "./abstractions.js";

/*
 * Deletes the workflow and clears the app's cached workflow list in `ReviewRepository` (R350),
 * also when the workflow was already gone; any other failure (a blocked delete, a transport
 * failure) leaves the cache.
 */
class DeleteWorkflowUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private repository: WorkflowEditorRepository.Interface,
        private reviewRepository: ReviewRepository.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): Promise<EditorWorkflow> {
        let workflow: EditorWorkflow;
        try {
            workflow = await this.repository.deleteWorkflow(params);
        } catch (error) {
            if (
                error instanceof GraphQLOperationError &&
                error.code === WorkflowErrorCode.NotFound
            ) {
                this.reviewRepository.invalidateWorkflows(params.app);
            }
            throw error;
        }
        this.reviewRepository.invalidateWorkflows(params.app);
        return workflow;
    }
}

export const DeleteWorkflowUseCase = UseCaseAbstraction.createImplementation({
    implementation: DeleteWorkflowUseCaseImpl,
    dependencies: [WorkflowEditorRepository, ReviewRepository]
});

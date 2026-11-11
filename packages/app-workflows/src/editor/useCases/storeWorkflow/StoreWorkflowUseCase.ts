import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import type { EditorWorkflow } from "~/editor/domain/types.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import { WorkflowEditorRepository } from "~/editor/repository/abstractions.js";
import { ReviewRepository } from "~/review/repository/abstractions.js";
import { StoreWorkflowUseCase as UseCaseAbstraction } from "./abstractions.js";

/*
 * Stores the workflow and clears the app's cached workflow list in `ReviewRepository` (R350): the
 * review UI must see the new bindings. A store that found the workflow gone clears it as well,
 * because the workflow is gone on the server; any other failure leaves the cache.
 */
class StoreWorkflowUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private repository: WorkflowEditorRepository.Interface,
        private reviewRepository: ReviewRepository.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): Promise<EditorWorkflow> {
        let workflow: EditorWorkflow;
        try {
            workflow = await this.repository.storeWorkflow(params);
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

export const StoreWorkflowUseCase = UseCaseAbstraction.createImplementation({
    implementation: StoreWorkflowUseCaseImpl,
    dependencies: [WorkflowEditorRepository, ReviewRepository]
});

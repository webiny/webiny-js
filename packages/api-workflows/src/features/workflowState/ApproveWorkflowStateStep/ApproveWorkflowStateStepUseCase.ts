import { Result } from "@webiny/feature/api";
import { GetWorkflowStateUseCase } from "../GetWorkflowState/index.js";
import { UpdateWorkflowStateRepository } from "../UpdateWorkflowState/index.js";
import { ApproveWorkflowStateStepUseCase as UseCase } from "./abstractions.js";

class ApproveWorkflowStateStepUseCaseImpl implements UseCase.Interface {
    constructor(
        private getWorkflowState: GetWorkflowStateUseCase.Interface,
        private repository: UpdateWorkflowStateRepository.Interface
    ) {}

    async execute(id: string, comment?: string): UseCase.Return {
        const stateResult = await this.getWorkflowState.execute(id);
        if (stateResult.isFail()) {
            return Result.fail(stateResult.error);
        }

        const state = stateResult.value;

        const approveResult = state.approve(comment);
        if (approveResult.isFail()) {
            return Result.fail(approveResult.error);
        }

        const updatedRecord = state.toRecord();

        const updateResult = await this.repository.execute(id, updatedRecord);
        if (updateResult.isFail()) {
            return Result.fail(updateResult.error);
        }

        return Result.ok(state);
    }
}

export const ApproveWorkflowStateStepUseCase = UseCase.createImplementation({
    implementation: ApproveWorkflowStateStepUseCaseImpl,
    dependencies: [GetWorkflowStateUseCase, UpdateWorkflowStateRepository]
});

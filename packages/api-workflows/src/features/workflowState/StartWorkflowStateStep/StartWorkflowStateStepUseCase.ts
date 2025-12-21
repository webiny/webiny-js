import { Result } from "@webiny/feature/api";
import { GetWorkflowStateUseCase } from "../GetWorkflowState/index.js";
import { UpdateWorkflowStateRepository } from "../UpdateWorkflowState/index.js";
import { StartWorkflowStateStepUseCase as UseCase } from "./abstractions.js";

class StartWorkflowStateStepUseCaseImpl implements UseCase.Interface {
    constructor(
        private getWorkflowState: GetWorkflowStateUseCase.Interface,
        private repository: UpdateWorkflowStateRepository.Interface
    ) {}

    async execute(id: string): UseCase.Return {
        const stateResult = await this.getWorkflowState.execute(id);
        if (stateResult.isFail()) {
            return Result.fail(stateResult.error);
        }

        const state = stateResult.value;

        const startResult = state.start();
        if (startResult.isFail()) {
            return Result.fail(startResult.error);
        }

        const updatedRecord = state.toRecord();

        const updateResult = await this.repository.execute(id, updatedRecord);
        if (updateResult.isFail()) {
            return Result.fail(updateResult.error);
        }

        return Result.ok(state);
    }
}

export const StartWorkflowStateStepUseCase = UseCase.createImplementation({
    implementation: StartWorkflowStateStepUseCaseImpl,
    dependencies: [GetWorkflowStateUseCase, UpdateWorkflowStateRepository]
});

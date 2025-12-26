import { UpdateWorkflowStateUseCase } from "../UpdateWorkflowState/index.js";
import { CancelWorkflowStateUseCase as UseCase } from "./abstractions.js";

class CancelWorkflowStateUseCaseImpl implements UseCase.Interface {
    constructor(private updateWorkflowState: UpdateWorkflowStateUseCase.Interface) {}

    async execute(id: string): UseCase.Return {
        return await this.updateWorkflowState.execute(id, {
            isActive: false
        });
    }
}

export const CancelWorkflowStateUseCase = UseCase.createImplementation({
    implementation: CancelWorkflowStateUseCaseImpl,
    dependencies: [UpdateWorkflowStateUseCase]
});

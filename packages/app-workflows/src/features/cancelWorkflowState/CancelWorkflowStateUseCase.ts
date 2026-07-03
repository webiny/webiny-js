import {
    CancelWorkflowStateUseCase as UseCaseAbstraction,
    CancelWorkflowStateGateway,
    type ICancelWorkflowStateParams
} from "./abstractions.js";

class CancelWorkflowStateUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private gateway: CancelWorkflowStateGateway.Interface) {}

    async execute(params: ICancelWorkflowStateParams) {
        return this.gateway.execute(params);
    }
}

export const CancelWorkflowStateUseCase = UseCaseAbstraction.createImplementation({
    implementation: CancelWorkflowStateUseCaseImpl,
    dependencies: [CancelWorkflowStateGateway]
});

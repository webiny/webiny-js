import {
    GetTargetWorkflowStateUseCase as UseCaseAbstraction,
    GetTargetWorkflowStateGateway,
    type IGetTargetWorkflowStateParams
} from "./abstractions.js";

class GetTargetWorkflowStateUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private gateway: GetTargetWorkflowStateGateway.Interface) {}

    async execute(params: IGetTargetWorkflowStateParams) {
        return this.gateway.execute(params);
    }
}

export const GetTargetWorkflowStateUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetTargetWorkflowStateUseCaseImpl,
    dependencies: [GetTargetWorkflowStateGateway]
});

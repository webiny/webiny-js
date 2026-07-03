import {
    ListWorkflowStatesUseCase as UseCaseAbstraction,
    ListWorkflowStatesGateway,
    type IListWorkflowStatesParams,
    type ListWorkflowStatesVariant
} from "./abstractions.js";

class ListWorkflowStatesUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private gateway: ListWorkflowStatesGateway.Interface) {}

    async execute(params?: IListWorkflowStatesParams, variant?: ListWorkflowStatesVariant) {
        return this.gateway.execute(params, variant);
    }
}

export const ListWorkflowStatesUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListWorkflowStatesUseCaseImpl,
    dependencies: [ListWorkflowStatesGateway]
});

import {
    ListWorkflowsUseCase as UseCaseAbstraction,
    ListWorkflowsGateway,
    type IListWorkflowsParams
} from "./abstractions.js";

class ListWorkflowsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private gateway: ListWorkflowsGateway.Interface) {}

    async execute(params?: IListWorkflowsParams) {
        return this.gateway.execute(params);
    }
}

export const ListWorkflowsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListWorkflowsUseCaseImpl,
    dependencies: [ListWorkflowsGateway]
});

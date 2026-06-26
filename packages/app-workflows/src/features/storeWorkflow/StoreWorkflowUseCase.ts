import {
    StoreWorkflowUseCase as UseCaseAbstraction,
    StoreWorkflowGateway
} from "./abstractions.js";
import type { IWorkflow } from "~/types.js";

class StoreWorkflowUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private gateway: StoreWorkflowGateway.Interface) {}

    async execute(workflow: IWorkflow) {
        return this.gateway.execute(workflow);
    }
}

export const StoreWorkflowUseCase = UseCaseAbstraction.createImplementation({
    implementation: StoreWorkflowUseCaseImpl,
    dependencies: [StoreWorkflowGateway]
});

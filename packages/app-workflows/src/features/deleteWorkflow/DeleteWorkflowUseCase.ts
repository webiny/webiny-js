import {
    DeleteWorkflowUseCase as UseCaseAbstraction,
    DeleteWorkflowGateway
} from "./abstractions.js";
import type { IWorkflow } from "~/types.js";

class DeleteWorkflowUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private gateway: DeleteWorkflowGateway.Interface) {}

    async execute(workflow: IWorkflow) {
        return this.gateway.execute(workflow);
    }
}

export const DeleteWorkflowUseCase = UseCaseAbstraction.createImplementation({
    implementation: DeleteWorkflowUseCaseImpl,
    dependencies: [DeleteWorkflowGateway]
});

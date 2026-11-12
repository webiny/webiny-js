import { WorkflowAppAccess } from "./abstractions.js";

class DefaultWorkflowAppAccessImpl implements WorkflowAppAccess.Interface {
    async canRead(): Promise<boolean> {
        return false;
    }
}

export const DefaultWorkflowAppAccess = WorkflowAppAccess.createImplementation({
    implementation: DefaultWorkflowAppAccessImpl,
    dependencies: []
});

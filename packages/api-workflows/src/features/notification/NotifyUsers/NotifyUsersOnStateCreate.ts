import { WorkflowStateAfterCreateHandler } from "~/features/workflowState/CreateWorkflowState/index.js";
import { GetWorkflow, TriggerAdapters } from "~/features/notification/NotifyUsers/abstractions.js";
import { NotificationAdapter } from "~/domain/notification/abstractions.js";
import type { NonEmptyArray } from "@webiny/api/types.js";

/**
 * This handler is responsible for notifying users when a new workflow state is created - a user requests a review of the entry.
 */
class NotifyUsersOnStateCreateImpl implements WorkflowStateAfterCreateHandler.Interface {
    public constructor(
        private getWorkflow: GetWorkflow.Interface,
        private triggerAdapters: TriggerAdapters.Interface
    ) {}

    public async handle(event: WorkflowStateAfterCreateHandler.Event): Promise<void> {
        /**
         * No point triggering adapters if none are registered.
         */
        if (this.triggerAdapters.hasAny() === false) {
            return;
        }
        const { state } = event.payload;

        const workflow = await this.getWorkflow.execute({
            id: state.workflowId,
            app: state.app
        });
        if (!workflow) {
            return;
        }
        // need to find all users that need to be notified.
        const users: NotificationAdapter.User[] = [];
        if (users.length === 0) {
            return;
        }
        // and then trigger all adapters
        await this.triggerAdapters.execute({
            state,
            workflow,
            users: users as NonEmptyArray<NotificationAdapter.User>,
            message
        });
    }
}

export const NotifyUsersOnStateCreate = WorkflowStateAfterCreateHandler.createImplementation({
    implementation: NotifyUsersOnStateCreateImpl,
    dependencies: [GetWorkflow, TriggerAdapters]
});

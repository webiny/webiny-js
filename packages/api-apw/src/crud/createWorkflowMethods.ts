import {
    ApwWorkflowCrud,
    CreateApwParams,
    OnWorkflowAfterCreateTopicParams,
    OnWorkflowAfterDeleteTopicParams,
    OnWorkflowAfterUpdateTopicParams,
    OnWorkflowBeforeCreateTopicParams,
    OnWorkflowBeforeDeleteTopicParams,
    OnWorkflowBeforeUpdateTopicParams
} from "~/types";
import { createTopic } from "@webiny/pubsub";
import { NotAuthorizedError } from "@webiny/api-security";

export function createWorkflowMethods({
    storageOperations,
    getPermission
}: CreateApwParams): ApwWorkflowCrud {
    // create
    const onWorkflowBeforeCreate = createTopic<OnWorkflowBeforeCreateTopicParams>(
        "apw.onWorkflowBeforeCreate"
    );
    const onWorkflowAfterCreate = createTopic<OnWorkflowAfterCreateTopicParams>(
        "apw.onWorkflowAfterCreate"
    );
    // update
    const onWorkflowBeforeUpdate = createTopic<OnWorkflowBeforeUpdateTopicParams>(
        "apw.onWorkflowBeforeUpdate"
    );
    const onWorkflowAfterUpdate = createTopic<OnWorkflowAfterUpdateTopicParams>(
        "apw.onWorkflowAfterUpdate"
    );
    // delete
    const onWorkflowBeforeDelete = createTopic<OnWorkflowBeforeDeleteTopicParams>(
        "apw.onWorkflowBeforeDelete"
    );
    const onWorkflowAfterDelete = createTopic<OnWorkflowAfterDeleteTopicParams>(
        "apw.onWorkflowAfterDelete"
    );

    const validateAccess = async (): Promise<void> => {
        const permission = await getPermission("apw.publishingWorkflows");
        if (!!permission) {
            return;
        }
        throw new NotAuthorizedError({
            message: "Not authorized to access publishing workflows."
        });
    };

    return {
        /**
         * Lifecycle events
         */
        onWorkflowBeforeCreate,
        onWorkflowAfterCreate,
        onWorkflowBeforeUpdate,
        onWorkflowAfterUpdate,
        onWorkflowBeforeDelete,
        onWorkflowAfterDelete,
        async get(id) {
            return storageOperations.getWorkflow({ id });
        },
        async list(params) {
            return storageOperations.listWorkflows(params || {});
        },
        async create(data) {
            await validateAccess();
            await onWorkflowBeforeCreate.publish({ input: data });

            const workflow = await storageOperations.createWorkflow({ data });

            await onWorkflowAfterCreate.publish({ workflow });

            return workflow;
        },
        async update(id, data) {
            await validateAccess();
            const original = await storageOperations.getWorkflow({ id });

            await onWorkflowBeforeUpdate.publish({ original, input: { id, data } });

            const workflow = await storageOperations.updateWorkflow({ id, data });

            await onWorkflowAfterUpdate.publish({ original, input: { id, data }, workflow });

            return workflow;
        },
        async delete(id: string) {
            await validateAccess();
            const workflow = await storageOperations.getWorkflow({ id });

            await onWorkflowBeforeDelete.publish({ workflow });

            await storageOperations.deleteWorkflow({ id });

            await onWorkflowAfterDelete.publish({ workflow });

            return true;
        }
    };
}

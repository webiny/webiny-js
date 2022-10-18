import {
    ApwWorkflowCrud,
    CreateApwParams,
    OnAfterWorkflowCreateTopicParams,
    OnAfterWorkflowDeleteTopicParams,
    OnAfterWorkflowUpdateTopicParams,
    OnBeforeWorkflowCreateTopicParams,
    OnBeforeWorkflowDeleteTopicParams,
    OnBeforeWorkflowUpdateTopicParams
} from "~/types";
import { createTopic } from "@webiny/pubsub";
import { NotAuthorizedError } from "@webiny/api-security";

export function createWorkflowMethods({
    storageOperations,
    getPermission
}: CreateApwParams): ApwWorkflowCrud {
    const onBeforeWorkflowCreate = createTopic<OnBeforeWorkflowCreateTopicParams>();
    const onAfterWorkflowCreate = createTopic<OnAfterWorkflowCreateTopicParams>();
    const onBeforeWorkflowUpdate = createTopic<OnBeforeWorkflowUpdateTopicParams>();
    const onAfterWorkflowUpdate = createTopic<OnAfterWorkflowUpdateTopicParams>();
    const onBeforeWorkflowDelete = createTopic<OnBeforeWorkflowDeleteTopicParams>();
    const onAfterWorkflowDelete = createTopic<OnAfterWorkflowDeleteTopicParams>();

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
        onBeforeWorkflowCreate,
        onAfterWorkflowCreate,
        onBeforeWorkflowUpdate,
        onAfterWorkflowUpdate,
        onBeforeWorkflowDelete,
        onAfterWorkflowDelete,
        async get(id) {
            return storageOperations.getWorkflow({ id });
        },
        async list(params) {
            return storageOperations.listWorkflows(params || {});
        },
        async create(data) {
            await validateAccess();
            await onBeforeWorkflowCreate.publish({ input: data });

            const workflow = await storageOperations.createWorkflow({ data });

            await onAfterWorkflowCreate.publish({ workflow });

            return workflow;
        },
        async update(id, data) {
            await validateAccess();
            const original = await storageOperations.getWorkflow({ id });

            await onBeforeWorkflowUpdate.publish({ original, input: { id, data } });

            const workflow = await storageOperations.updateWorkflow({ id, data });

            await onAfterWorkflowUpdate.publish({ original, input: { id, data }, workflow });

            return workflow;
        },
        async delete(id: string) {
            await validateAccess();
            const workflow = await storageOperations.getWorkflow({ id });

            await onBeforeWorkflowDelete.publish({ workflow });

            await storageOperations.deleteWorkflow({ id });

            await onAfterWorkflowDelete.publish({ workflow });

            return true;
        }
    };
}

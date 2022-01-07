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

export function createWorkflowMethods({ storageOperations }: CreateApwParams): ApwWorkflowCrud {
    const onBeforeWorkflowCreate = createTopic<OnBeforeWorkflowCreateTopicParams>();
    const onAfterWorkflowCreate = createTopic<OnAfterWorkflowCreateTopicParams>();
    const onBeforeWorkflowUpdate = createTopic<OnBeforeWorkflowUpdateTopicParams>();
    const onAfterWorkflowUpdate = createTopic<OnAfterWorkflowUpdateTopicParams>();
    const onBeforeWorkflowDelete = createTopic<OnBeforeWorkflowDeleteTopicParams>();
    const onAfterWorkflowDelete = createTopic<OnAfterWorkflowDeleteTopicParams>();
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
            return storageOperations.listWorkflows(params);
        },
        async create(data) {
            await onBeforeWorkflowCreate.publish({ input: data });

            const workflow = await storageOperations.createWorkflow({ data });

            await onAfterWorkflowCreate.publish({ workflow });

            return workflow;
        },
        async update(id, data) {
            const original = await storageOperations.getWorkflow({ id });

            await onBeforeWorkflowUpdate.publish({ original, input: { id, data } });

            const workflow = await storageOperations.updateWorkflow({ id, data });

            await onAfterWorkflowUpdate.publish({ original, input: { id, data }, workflow });

            return workflow;
        },
        async delete(id: string) {
            const workflow = await storageOperations.getWorkflow({ id });

            await onBeforeWorkflowDelete.publish({ workflow });

            await storageOperations.deleteWorkflow({ id });

            await onAfterWorkflowDelete.publish({ workflow });

            return true;
        }
    };
}

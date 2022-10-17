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

export function createWorkflowMethods({ storageOperations }: CreateApwParams): ApwWorkflowCrud {
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
            return storageOperations.listWorkflows(params);
        },
        async create(data) {
            await onWorkflowBeforeCreate.publish({ input: data });

            const workflow = await storageOperations.createWorkflow({ data });

            await onWorkflowAfterCreate.publish({ workflow });

            return workflow;
        },
        async update(id, data) {
            const original = await storageOperations.getWorkflow({ id });

            await onWorkflowBeforeUpdate.publish({ original, input: { id, data } });

            const workflow = await storageOperations.updateWorkflow({ id, data });

            await onWorkflowAfterUpdate.publish({ original, input: { id, data }, workflow });

            return workflow;
        },
        async delete(id: string) {
            const workflow = await storageOperations.getWorkflow({ id });

            await onWorkflowBeforeDelete.publish({ workflow });

            await storageOperations.deleteWorkflow({ id });

            await onWorkflowAfterDelete.publish({ workflow });

            return true;
        }
    };
}

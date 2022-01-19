import { createTopic } from "@webiny/pubsub";
import {
    ApwChangeRequestCrud,
    CreateApwParams,
    OnAfterChangeRequestCreateTopicParams,
    OnAfterChangeRequestDeleteTopicParams,
    OnAfterChangeRequestUpdateTopicParams,
    OnBeforeChangeRequestCreateTopicParams,
    OnBeforeChangeRequestDeleteTopicParams,
    OnBeforeChangeRequestUpdateTopicParams
} from "~/types";

export function createChangeRequestMethods({
    storageOperations
}: CreateApwParams): ApwChangeRequestCrud {
    const onBeforeChangeRequestCreate = createTopic<OnBeforeChangeRequestCreateTopicParams>();
    const onAfterChangeRequestCreate = createTopic<OnAfterChangeRequestCreateTopicParams>();
    const onBeforeChangeRequestUpdate = createTopic<OnBeforeChangeRequestUpdateTopicParams>();
    const onAfterChangeRequestUpdate = createTopic<OnAfterChangeRequestUpdateTopicParams>();
    const onBeforeChangeRequestDelete = createTopic<OnBeforeChangeRequestDeleteTopicParams>();
    const onAfterChangeRequestDelete = createTopic<OnAfterChangeRequestDeleteTopicParams>();

    return {
        async get(id) {
            return storageOperations.getChangeRequest({ id });
        },
        async list(params) {
            return storageOperations.listChangeRequests(params);
        },
        async create(data) {
            await onBeforeChangeRequestCreate.publish({ input: data });

            const changeRequest = await storageOperations.createChangeRequest({ data });

            await onAfterChangeRequestCreate.publish({ changeRequest });

            return changeRequest;
        },
        async update(id, data) {
            const original = await storageOperations.getChangeRequest({ id });

            await onBeforeChangeRequestUpdate.publish({ original, input: { id, data } });

            const changeRequest = await storageOperations.updateChangeRequest({ id, data });

            await onAfterChangeRequestUpdate.publish({
                original,
                input: { id, data },
                changeRequest
            });

            return changeRequest;
        },
        async delete(id: string) {
            const changeRequest = await storageOperations.getChangeRequest({ id });

            await onBeforeChangeRequestDelete.publish({ changeRequest });

            await storageOperations.deleteChangeRequest({ id });

            await onAfterChangeRequestDelete.publish({ changeRequest });

            return true;
        },
        /**
         * Lifecycle events
         */
        onBeforeChangeRequestCreate,
        onAfterChangeRequestCreate,
        onBeforeChangeRequestUpdate,
        onAfterChangeRequestUpdate,
        onBeforeChangeRequestDelete,
        onAfterChangeRequestDelete
    };
}

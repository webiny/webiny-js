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
    // create
    const onBeforeChangeRequestCreate = createTopic<OnBeforeChangeRequestCreateTopicParams>(
        "apw.onBeforeChangeRequestCreate"
    );
    const onAfterChangeRequestCreate = createTopic<OnAfterChangeRequestCreateTopicParams>(
        "apw.onAfterChangeRequestCreate"
    );
    // update
    const onBeforeChangeRequestUpdate = createTopic<OnBeforeChangeRequestUpdateTopicParams>(
        "apw.onBeforeChangeRequestUpdate"
    );
    const onAfterChangeRequestUpdate = createTopic<OnAfterChangeRequestUpdateTopicParams>(
        "apw.onAfterChangeRequestUpdate"
    );
    // delete
    const onBeforeChangeRequestDelete = createTopic<OnBeforeChangeRequestDeleteTopicParams>(
        "apw.onBeforeChangeRequestDelete"
    );
    const onAfterChangeRequestDelete = createTopic<OnAfterChangeRequestDeleteTopicParams>(
        "apw.onAfterChangeRequestDelete"
    );

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

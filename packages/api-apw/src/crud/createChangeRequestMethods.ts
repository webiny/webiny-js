import { createTopic } from "@webiny/pubsub";
import {
    ApwChangeRequestCrud,
    CreateApwParams,
    OnChangeRequestAfterCreateTopicParams,
    OnChangeRequestAfterDeleteTopicParams,
    OnChangeRequestAfterUpdateTopicParams,
    OnChangeRequestBeforeCreateTopicParams,
    OnChangeRequestBeforeDeleteTopicParams,
    OnChangeRequestBeforeUpdateTopicParams
} from "~/types";

export function createChangeRequestMethods({
    storageOperations
}: CreateApwParams): ApwChangeRequestCrud {
    // create
    const onChangeRequestBeforeCreate = createTopic<OnChangeRequestBeforeCreateTopicParams>(
        "apw.onChangeRequestBeforeCreate"
    );
    const onChangeRequestAfterCreate = createTopic<OnChangeRequestAfterCreateTopicParams>(
        "apw.onChangeRequestAfterCreate"
    );
    // update
    const onChangeRequestBeforeUpdate = createTopic<OnChangeRequestBeforeUpdateTopicParams>(
        "apw.onChangeRequestBeforeUpdate"
    );
    const onChangeRequestAfterUpdate = createTopic<OnChangeRequestAfterUpdateTopicParams>(
        "apw.onChangeRequestAfterUpdate"
    );
    // delete
    const onChangeRequestBeforeDelete = createTopic<OnChangeRequestBeforeDeleteTopicParams>(
        "apw.onChangeRequestBeforeDelete"
    );
    const onChangeRequestAfterDelete = createTopic<OnChangeRequestAfterDeleteTopicParams>(
        "apw.onChangeRequestAfterDelete"
    );

    return {
        async get(id) {
            return storageOperations.getChangeRequest({ id });
        },
        async list(params) {
            return storageOperations.listChangeRequests(params);
        },
        async create(data) {
            await onChangeRequestBeforeCreate.publish({ input: data });

            const changeRequest = await storageOperations.createChangeRequest({ data });

            await onChangeRequestAfterCreate.publish({ changeRequest });

            return changeRequest;
        },
        async update(id, data) {
            const original = await storageOperations.getChangeRequest({ id });

            await onChangeRequestBeforeUpdate.publish({ original, input: { id, data } });

            const changeRequest = await storageOperations.updateChangeRequest({ id, data });

            await onChangeRequestAfterUpdate.publish({
                original,
                input: { id, data },
                changeRequest
            });

            return changeRequest;
        },
        async delete(id: string) {
            const changeRequest = await storageOperations.getChangeRequest({ id });

            await onChangeRequestBeforeDelete.publish({ changeRequest });

            await storageOperations.deleteChangeRequest({ id });

            await onChangeRequestAfterDelete.publish({ changeRequest });

            return true;
        },
        /**
         * Lifecycle events
         */
        onChangeRequestBeforeCreate,
        onChangeRequestAfterCreate,
        onChangeRequestBeforeUpdate,
        onChangeRequestAfterUpdate,
        onChangeRequestBeforeDelete,
        onChangeRequestAfterDelete
    };
}

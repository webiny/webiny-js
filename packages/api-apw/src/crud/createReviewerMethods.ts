import {
    ApwReviewerCrud,
    CreateApwParams,
    OnAfterReviewerCreateTopicParams,
    OnAfterReviewerDeleteTopicParams,
    OnAfterReviewerUpdateTopicParams,
    OnBeforeReviewerCreateTopicParams,
    OnBeforeReviewerDeleteTopicParams,
    OnBeforeReviewerUpdateTopicParams
} from "~/types";
import { createTopic } from "@webiny/pubsub";

export function createReviewerMethods({ storageOperations }: CreateApwParams): ApwReviewerCrud {
    const onBeforeReviewerCreate = createTopic<OnBeforeReviewerCreateTopicParams>();
    const onAfterReviewerCreate = createTopic<OnAfterReviewerCreateTopicParams>();
    const onBeforeReviewerUpdate = createTopic<OnBeforeReviewerUpdateTopicParams>();
    const onAfterReviewerUpdate = createTopic<OnAfterReviewerUpdateTopicParams>();
    const onBeforeReviewerDelete = createTopic<OnBeforeReviewerDeleteTopicParams>();
    const onAfterReviewerDelete = createTopic<OnAfterReviewerDeleteTopicParams>();
    return {
        /**
         * Lifecycle events
         */
        onBeforeReviewerCreate,
        onAfterReviewerCreate,
        onBeforeReviewerUpdate,
        onAfterReviewerUpdate,
        onBeforeReviewerDelete,
        onAfterReviewerDelete,
        async get(id) {
            return storageOperations.getReviewer({ id });
        },
        async list(params) {
            return storageOperations.listReviewers(params);
        },
        async create(data) {
            await onBeforeReviewerCreate.publish({ input: data });

            const reviewer = await storageOperations.createReviewer({ data });

            await onAfterReviewerCreate.publish({ reviewer });

            return reviewer;
        },
        async update(id, data) {
            const original = await storageOperations.getReviewer({ id });

            await onBeforeReviewerUpdate.publish({ original, input: { id, data } });

            const reviewer = await storageOperations.updateReviewer({ id, data });

            await onAfterReviewerUpdate.publish({ original, input: { id, data }, reviewer });

            return reviewer;
        },
        async delete(id: string) {
            const reviewer = await storageOperations.getReviewer({ id });

            await onBeforeReviewerDelete.publish({ reviewer });

            await storageOperations.deleteReviewer({ id });

            await onAfterReviewerDelete.publish({ reviewer });

            return true;
        }
    };
}

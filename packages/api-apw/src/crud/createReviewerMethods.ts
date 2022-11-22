import {
    ApwReviewerCrud,
    CreateApwParams,
    OnReviewerAfterCreateTopicParams,
    OnReviewerAfterDeleteTopicParams,
    OnReviewerAfterUpdateTopicParams,
    OnReviewerBeforeCreateTopicParams,
    OnReviewerBeforeDeleteTopicParams,
    OnReviewerBeforeUpdateTopicParams
} from "~/types";
import { createTopic } from "@webiny/pubsub";

export function createReviewerMethods({ storageOperations }: CreateApwParams): ApwReviewerCrud {
    // create
    const onReviewerBeforeCreate = createTopic<OnReviewerBeforeCreateTopicParams>(
        "apw.onReviewerBeforeCreate"
    );
    const onReviewerAfterCreate = createTopic<OnReviewerAfterCreateTopicParams>(
        "apw.onReviewerAfterCreate"
    );
    // update
    const onReviewerBeforeUpdate = createTopic<OnReviewerBeforeUpdateTopicParams>(
        "apw.onReviewerBeforeUpdate"
    );
    const onReviewerAfterUpdate = createTopic<OnReviewerAfterUpdateTopicParams>(
        "apw.onReviewerAfterUpdate"
    );
    // delete
    const onReviewerBeforeDelete = createTopic<OnReviewerBeforeDeleteTopicParams>(
        "apw.onReviewerBeforeDelete"
    );
    const onReviewerAfterDelete = createTopic<OnReviewerAfterDeleteTopicParams>(
        "apw.onReviewerAfterDelete"
    );
    return {
        /**
         * Lifecycle events
         */
        onReviewerBeforeCreate,
        onReviewerAfterCreate,
        onReviewerBeforeUpdate,
        onReviewerAfterUpdate,
        onReviewerBeforeDelete,
        onReviewerAfterDelete,
        async get(id) {
            return storageOperations.getReviewer({ id });
        },
        async list(params) {
            return storageOperations.listReviewers(params);
        },
        async create(data) {
            await onReviewerBeforeCreate.publish({ input: data });

            const reviewer = await storageOperations.createReviewer({ data });

            await onReviewerAfterCreate.publish({ reviewer });

            return reviewer;
        },
        async update(id, data) {
            const original = await storageOperations.getReviewer({ id });

            await onReviewerBeforeUpdate.publish({ original, input: { id, data } });

            const reviewer = await storageOperations.updateReviewer({ id, data });

            await onReviewerAfterUpdate.publish({ original, input: { id, data }, reviewer });

            return reviewer;
        },
        async delete(id: string) {
            const reviewer = await storageOperations.getReviewer({ id });

            await onReviewerBeforeDelete.publish({ reviewer });

            await storageOperations.deleteReviewer({ id });

            await onReviewerAfterDelete.publish({ reviewer });

            return true;
        }
    };
}

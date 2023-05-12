import { createTopic } from "@webiny/pubsub";
import {
    ApwCommentCrud,
    CreateApwParams,
    OnCommentBeforeCreateTopicParams,
    OnCommentAfterCreateTopicParams,
    OnCommentBeforeUpdateTopicParams,
    OnCommentAfterUpdateTopicParams,
    OnCommentBeforeDeleteTopicParams,
    OnCommentAfterDeleteTopicParams
} from "~/types";

export function createCommentMethods({ storageOperations }: CreateApwParams): ApwCommentCrud {
    // create
    const onCommentBeforeCreate = createTopic<OnCommentBeforeCreateTopicParams>(
        "apw.onCommentBeforeCreate"
    );
    const onCommentAfterCreate = createTopic<OnCommentAfterCreateTopicParams>(
        "apw.onCommentAfterCreate"
    );
    // update
    const onCommentBeforeUpdate = createTopic<OnCommentBeforeUpdateTopicParams>(
        "apw.onCommentBeforeUpdate"
    );
    const onCommentAfterUpdate = createTopic<OnCommentAfterUpdateTopicParams>(
        "apw.onCommentAfterUpdate"
    );
    // delete
    const onCommentBeforeDelete = createTopic<OnCommentBeforeDeleteTopicParams>(
        "apw.onCommentBeforeDelete"
    );
    const onCommentAfterDelete = createTopic<OnCommentAfterDeleteTopicParams>(
        "apw.onCommentAfterDelete"
    );

    return {
        /**
         * Lifecycle events
         */
        onCommentBeforeCreate,
        onCommentAfterCreate,
        onCommentBeforeUpdate,
        onCommentAfterUpdate,
        onCommentBeforeDelete,
        onCommentAfterDelete,
        async get(id) {
            return storageOperations.getComment({ id });
        },
        async list(params) {
            return storageOperations.listComments(params);
        },
        async create(data) {
            await onCommentBeforeCreate.publish({ input: data });

            const comment = await storageOperations.createComment({
                data
            });
            await onCommentAfterCreate.publish({ comment });

            return comment;
        },
        async update(id, data) {
            const original = await storageOperations.getComment({ id });

            await onCommentBeforeUpdate.publish({ original, input: { id, data } });

            const comment = await storageOperations.updateComment({ id, data });

            await onCommentAfterUpdate.publish({ original, comment, input: { id, data } });

            return comment;
        },
        async delete(id: string) {
            const comment = await storageOperations.getComment({ id });

            await onCommentBeforeDelete.publish({ comment });

            await storageOperations.deleteComment({ id });

            await onCommentAfterDelete.publish({ comment });

            return true;
        }
    };
}

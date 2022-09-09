import { createTopic } from "@webiny/pubsub";
import {
    ApwCommentCrud,
    CreateApwParams,
    OnBeforeCommentCreateTopicParams,
    OnAfterCommentCreateTopicParams,
    OnBeforeCommentUpdateTopicParams,
    OnAfterCommentUpdateTopicParams,
    OnBeforeCommentDeleteTopicParams,
    OnAfterCommentDeleteTopicParams
} from "~/types";

export function createCommentMethods({ storageOperations }: CreateApwParams): ApwCommentCrud {
    // create
    const onBeforeCommentCreate = createTopic<OnBeforeCommentCreateTopicParams>(
        "apw.onBeforeCommentCreate"
    );
    const onAfterCommentCreate = createTopic<OnAfterCommentCreateTopicParams>(
        "apw.onAfterCommentCreate"
    );
    // update
    const onBeforeCommentUpdate = createTopic<OnBeforeCommentUpdateTopicParams>(
        "apw.onBeforeCommentUpdate"
    );
    const onAfterCommentUpdate = createTopic<OnAfterCommentUpdateTopicParams>(
        "apw.onAfterCommentUpdate"
    );
    // delete
    const onBeforeCommentDelete = createTopic<OnBeforeCommentDeleteTopicParams>(
        "apw.onBeforeCommentDelete"
    );
    const onAfterCommentDelete = createTopic<OnAfterCommentDeleteTopicParams>(
        "apw.onAfterCommentDelete"
    );

    return {
        /**
         * Lifecycle events
         */
        onBeforeCommentCreate,
        onAfterCommentCreate,
        onBeforeCommentUpdate,
        onAfterCommentUpdate,
        onBeforeCommentDelete,
        onAfterCommentDelete,
        async get(id) {
            return storageOperations.getComment({ id });
        },
        async list(params) {
            return storageOperations.listComments(params);
        },
        async create(data) {
            await onBeforeCommentCreate.publish({ input: data });

            const comment = await storageOperations.createComment({
                data
            });
            await onAfterCommentCreate.publish({ comment });

            return comment;
        },
        async update(id, data) {
            const original = await storageOperations.getComment({ id });

            await onBeforeCommentUpdate.publish({ original, input: { id, data } });

            const comment = await storageOperations.updateComment({ id, data });

            await onAfterCommentUpdate.publish({ original, comment, input: { id, data } });

            return comment;
        },
        async delete(id: string) {
            const comment = await storageOperations.getComment({ id });

            await onBeforeCommentDelete.publish({ comment });

            await storageOperations.deleteComment({ id });

            await onAfterCommentDelete.publish({ comment });

            return true;
        }
    };
}

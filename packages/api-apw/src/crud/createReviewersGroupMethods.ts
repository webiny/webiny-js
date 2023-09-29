import {
    ApwReviewersGroup,
    ApwReviewsGroupCrud,
    CreateApwParams,
    CreateApwReviewsGroupParams,
    OnReviewerGroupAfterCreateTopicParams,
    OnReviewerGroupBeforeCreateTopicParams,
    UpdateApwReviewsGroupParams
} from "~/types";
import { createTopic } from "@webiny/pubsub";

export function createReviewersGroupMethods({
    storageOperations
}: CreateApwParams): ApwReviewsGroupCrud {
    // create
    const onReviewersGroupBeforeCreate = createTopic<OnReviewerGroupBeforeCreateTopicParams>(
        "apw.onReviewersGroupBeforeCreate"
    );
    const onReviewersGroupAfterCreate = createTopic<OnReviewerGroupAfterCreateTopicParams>(
        "apw.onReviewersGroupAfterCreate"
    );

    return {
        onReviewersGroupBeforeCreate,
        onReviewersGroupAfterCreate,
        async create(data: CreateApwReviewsGroupParams): Promise<ApwReviewersGroup> {
            await onReviewersGroupBeforeCreate.publish(data);

            const reviewersGroup = await storageOperations.createReviewersGroup({ data });

            await onReviewersGroupAfterCreate.publish({ group: reviewersGroup });

            return reviewersGroup;
        },
        async get(id: string): Promise<ApwReviewersGroup> {
            return new Promise<ApwReviewersGroup>();
        },
        async update(id: string, data: UpdateApwReviewsGroupParams): Promise<ApwReviewersGroup> {
            return null;
        },
        async delete(id: string): Promise<Boolean> {}
    };
}

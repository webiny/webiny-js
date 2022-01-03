import { CmsEntry, CmsModel } from "@webiny/api-headless-cms/types";
import { ApwContentReview, ApwContentReviewCrud, LifeCycleHookCallbackParams } from "~/types";

const isEqual = ({
    entry,
    original,
    property
}: {
    entry: CmsEntry;
    original: CmsEntry;
    property: string;
}): Boolean => {
    const currentValue = entry.values[property];
    const previousValue = original.values[property];

    return currentValue === previousValue;
};

interface UpdatePendingChangeRequestsParams {
    contentReview: ApwContentReviewCrud;
    entry: CmsEntry;
    delta: number;
}

const updatePendingChangeRequests = async ({
    contentReview,
    entry,
    delta
}: UpdatePendingChangeRequestsParams): Promise<void> => {
    const stepSlug = entry.values.step;
    /*
     * Get associated content review entry.
     */
    const entryId = stepSlug.split("#")[0];

    let contentReviewEntry: ApwContentReview;
    try {
        [[contentReviewEntry]] = await contentReview.list({
            where: {
                entryId
            }
        });
    } catch (e) {
        if (e.message !== "index_not_found_exception") {
            throw e;
        }
    }
    if (contentReviewEntry) {
        /**
         * Update "pendingChangeRequests" count of corresponding step in content review entry.
         */
        try {
            await contentReview.update(contentReviewEntry.id, {
                steps: contentReviewEntry.steps.map(step => {
                    if (step.slug === stepSlug) {
                        return {
                            ...step,
                            pendingChangeRequests: step.pendingChangeRequests + delta
                        };
                    }
                    return step;
                })
            });
        } catch (e) {
            if (e.code !== "NOT_FOUND") {
                throw e;
            }
        }
    }
};

const isChangeRequestModel = async ({
    getChangeRequestModel,
    model
}: {
    getChangeRequestModel: () => Promise<CmsModel>;
    model: CmsModel;
}): Promise<Boolean> => {
    const changeRequestModel = await getChangeRequestModel();
    return model.modelId === changeRequestModel.modelId;
};

export const updatePendingChangeRequestsCount = ({ apw, cms }: LifeCycleHookCallbackParams) => {
    const getChangeRequestModel = apw.changeRequest.getModel;

    cms.onAfterEntryDelete.subscribe(async ({ model, entry }) => {
        /**
         * If deleted entry is of "changeRequest" model, decrement the "pendingChangeRequests" count
         * in the corresponding step of the content review entry.
         */
        if (await isChangeRequestModel({ getChangeRequestModel, model })) {
            await updatePendingChangeRequests({
                contentReview: apw.contentReview,
                entry,
                delta: -1
            });
        }
    });

    cms.onAfterEntryCreate.subscribe(async ({ model, entry }) => {
        /**
         * If the created entry is of "changeRequest" type, increment the "pendingChangeRequests" count
         * of the corresponding step in the content review entry.
         */
        if (await isChangeRequestModel({ getChangeRequestModel, model })) {
            await updatePendingChangeRequests({
                contentReview: apw.contentReview,
                entry,
                delta: 1
            });
        }
    });

    cms.onAfterEntryUpdate.subscribe(async ({ model, entry, original }) => {
        /**
         * If the updated entry is of "changeRequest" type and the value of "resolved" field has changed;
         * then we also need to update the "pendingChangeRequests" count of the corresponding step in the content review entry.
         */
        if (
            (await isChangeRequestModel({ getChangeRequestModel, model })) &&
            !isEqual({ entry, original, property: "resolved" })
        ) {
            const resolved = entry.values.resolved;
            const delta = resolved === true ? -1 : 1;
            await updatePendingChangeRequests({ contentReview: apw.contentReview, entry, delta });
        }
    });
};

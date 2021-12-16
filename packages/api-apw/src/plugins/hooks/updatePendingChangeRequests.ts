import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { ApwContext } from "~/types";
import { CmsEntry } from "@webiny/api-headless-cms/types";
import { CmsModel } from "@webiny/api-headless-cms/types";

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
    context: ApwContext;
    entry: CmsEntry;
    delta: number;
}

const updatePendingChangeRequests = async ({
    context,
    entry,
    delta
}: UpdatePendingChangeRequestsParams): Promise<void> => {
    const stepSlug = entry.values.step;
    /*
     * Get associated content review entry.
     */
    const entryId = stepSlug.split("#")[0];

    let contentReviewEntry;
    try {
        [[contentReviewEntry]] = await context.advancedPublishingWorkflow.contentReview.list({
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
            await context.advancedPublishingWorkflow.contentReview.update(contentReviewEntry.id, {
                steps: contentReviewEntry.values.steps.map(step => {
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
            if (e.code === "NOT_FOUND") {
                console.info(`Trying to update a non-existing entry!`);
            } else {
                throw e;
            }
        }
    }
};

const isChangeRequestModel = async ({
    context,
    model
}: {
    context: ApwContext;
    model: CmsModel;
}): Promise<Boolean> => {
    const changeRequestModel = await context.advancedPublishingWorkflow.changeRequest.getModel();
    return model.modelId === changeRequestModel.modelId;
};

const updatePendingChangeRequestsCount = () =>
    new ContextPlugin<ApwContext>(async context => {
        context.cms.onAfterEntryDelete.subscribe(async ({ model, entry }) => {
            /**
             * If deleted entry is of "changeRequest" model, decrement the "pendingChangeRequests" count
             * in the corresponding step of the content review entry.
             */
            if (await isChangeRequestModel({ context, model })) {
                await updatePendingChangeRequests({ context, entry, delta: -1 });
            }
        });

        context.cms.onAfterEntryCreate.subscribe(async ({ model, entry }) => {
            /**
             * If the created entry is of "changeRequest" type, increment the "pendingChangeRequests" count
             * of the corresponding step in the content review entry.
             */
            if (await isChangeRequestModel({ context, model })) {
                await updatePendingChangeRequests({ context, entry, delta: 1 });
            }
        });

        context.cms.onAfterEntryUpdate.subscribe(async ({ model, entry, original }) => {
            /**
             * If the updated entry is of "changeRequest" type and the value of "resolved" field has changed;
             * then we also need to update the "pendingChangeRequests" count of the corresponding step in the content review entry.
             */
            if (
                (await isChangeRequestModel({ context, model })) &&
                !isEqual({ entry, original, property: "resolved" })
            ) {
                const resolved = entry.values.resolved;
                const delta = resolved === true ? -1 : 1;
                await updatePendingChangeRequests({ context, entry, delta });
            }
        });
    });

export default () => [updatePendingChangeRequestsCount()];

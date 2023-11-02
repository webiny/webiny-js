import set from "lodash/set";
import { AdvancedPublishingWorkflow } from "~/types";
import {
    assignWorkflowToEntry,
    getEntryTitle,
    hasEntries,
    isApwDisabledOnModel,
    updateEntryMeta
} from "~/plugins/cms/utils";
import { HeadlessCms } from "@webiny/api-headless-cms/types";

interface Value {
    id: string;
    modelId: string;
}

interface LinkWorkflowToEntryParams {
    apw: AdvancedPublishingWorkflow;
    cms: HeadlessCms;
}
export const linkWorkflowToEntry = (params: LinkWorkflowToEntryParams) => {
    const { apw, cms } = params;

    cms.onEntryBeforeCreate.subscribe(async ({ entry, model }) => {
        if (isApwDisabledOnModel(model)) {
            return;
        }
        await assignWorkflowToEntry({
            apw,
            entry,
            model
        });
    });

    cms.onEntryRevisionBeforeCreate.subscribe(async ({ entry, original, model }) => {
        if (isApwDisabledOnModel(model)) {
            return;
        }
        /**
         * If the previous revision(original) already had the "contentReviewId",
         * we need to unlink it so that new "contentReview" can be request for the new revision.
         */
        const previousContentReviewId = original.meta?.apw?.contentReviewId;
        if (previousContentReviewId) {
            entry.meta = set(entry.meta || {}, "apw.contentReviewId", null);
        }

        /**
         * If the previous revision(original) already had the "workflowId",
         * we don't need to do anything we'll just let it be copied over.
         */
        const previousWorkflowId = original.meta?.apw?.workflowId;
        if (previousWorkflowId) {
            return;
        }
        /**
         * Lookup and assign "workflowId".
         */
        await assignWorkflowToEntry({
            apw,
            entry,
            model
        });
    });

    cms.onEntryBeforeUpdate.subscribe(async ({ entry, original, model }) => {
        if (isApwDisabledOnModel(model)) {
            return;
        }
        const prevApwWorkflowId = original.meta?.apw?.workflowId;
        const currentApwWorkflowId = entry.meta?.apw?.workflowId;
        /**
         * Make sure the apw property doesn't get lost between updates.
         * It can happen because we run modal validation in "onBeforePageUpdate" event,
         * which doesn't have the "apw" property.
         */
        if (prevApwWorkflowId && !currentApwWorkflowId) {
            entry.meta = set(entry.meta || {}, "apw", (original.meta || {}).apw || {});
        }
        /*
         * If there is a linked "contentReview" for this page and the page "title" has changed.
         * Let's update the "title" field in "contentReview".
         */
        const linkedContentReviewId = entry.meta?.apw?.contentReviewId;
        const prevTitle = getEntryTitle(model, original);
        const newTitle = getEntryTitle(model, entry);

        if (!linkedContentReviewId || prevTitle === newTitle) {
            return;
        }
        await apw.contentReview.update(linkedContentReviewId, {
            title: newTitle
        });
    });

    /**
     * Link created workflow to associated entries.
     */
    apw.workflow.onWorkflowAfterCreate.subscribe(async ({ workflow }) => {
        const { scope } = workflow;
        /**
         * If the workflow has entries in it's scope, we'll link that workflow for each of those entries.
         */
        if (hasEntries(workflow) === false) {
            return;
        }

        const models = await cms.listModels();

        const values: Value[] | undefined = scope.data?.entries;
        if (!values || Array.isArray(values) === false || values.length === 0) {
            return;
        }

        for (const value of values) {
            if (!value || !value.modelId || !value.id) {
                continue;
            }
            const model = models.find(m => m.modelId === value.modelId);
            if (!model) {
                continue;
            }
            await updateEntryMeta({
                cms,
                model,
                entryId: value.id,
                meta: {
                    apw: {
                        workflowId: workflow.id
                    }
                }
            });
        }
    });
};

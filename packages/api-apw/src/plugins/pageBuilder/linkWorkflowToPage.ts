import get from "lodash/get";
import set from "lodash/set";
import {
    LifeCycleHookCallbackParams,
    ApwOnBeforePageCreateTopicParams,
    ApwOnBeforePageCreateFromTopicParams,
    ApwOnBeforePageUpdateTopicParams
} from "~/types";
import {
    getPagesDiff,
    hasPages,
    updatePageSettings,
    shouldUpdatePages,
    assignWorkflowToPage
} from "./utils";
import { ApwPageBuilderMethods } from "~/plugins/pageBuilder/index";

interface LinkWorkflowToPageParams
    extends Pick<LifeCycleHookCallbackParams, "apw">,
        Pick<
            ApwPageBuilderMethods,
            | "getPage"
            | "updatePage"
            | "onBeforePageCreate"
            | "onBeforePageCreateFrom"
            | "onBeforePageUpdate"
        > {}

export const linkWorkflowToPage = (params: LinkWorkflowToPageParams) => {
    const {
        apw,
        getPage,
        updatePage,
        onBeforePageCreate,
        onBeforePageCreateFrom,
        onBeforePageUpdate
    } = params;

    // TODO: @ashutosh move PB specific code into "api-apw-page-builder" package
    onBeforePageCreate.subscribe<ApwOnBeforePageCreateTopicParams>(async ({ page }) => {
        await assignWorkflowToPage({ listWorkflow: apw.workflow.list, page });
    });
    onBeforePageCreateFrom.subscribe<ApwOnBeforePageCreateFromTopicParams>(async params => {
        const { page, original } = params;
        /**
         * If the previous revision(original) already had the "contentReviewId",
         * we need to unlink it so that new "contentReview" can be request for the new revision.
         */
        const previousContentReviewId = get(original, "settings.apw.contentReviewId");
        if (previousContentReviewId) {
            page.settings.apw.contentReviewId = null;
        }

        /**
         * If the previous revision(original) already had the "workflowId",
         * we don't need to do anything we'll just let it be copied over.
         */
        const previousWorkflowId = get(original, "settings.apw.workflowId");
        if (previousWorkflowId) {
            return;
        }
        /**
         * Lookup and assign "workflowId".
         */
        await assignWorkflowToPage({ listWorkflow: apw.workflow.list, page });
    });
    onBeforePageUpdate.subscribe<ApwOnBeforePageUpdateTopicParams>(async params => {
        const { page, original } = params;
        const prevApwWorkflowId = get(original, "settings.apw");
        const currentApwWorkflowId = get(page, "settings.apw");
        /**
         * Make sure the apw property doesn't get lost between updates.
         * It can happen because we run modal validation in "onBeforePageUpdate" event,
         * which doesn't have the "apw" property.
         */
        if (prevApwWorkflowId && !currentApwWorkflowId) {
            page.settings.apw = original.settings.apw;
        }
        /*
         * If there is a linked "contentReview" for this page and the page "title" has changed.
         * Let's update the "title" field in "contentReview".
         */
        const linkedContentReviewId = get(page, "settings.apw.contentReviewId");
        const prevTitle = get(original, "title");
        const newTitle = get(page, "title");

        if (linkedContentReviewId && prevTitle !== newTitle) {
            await apw.contentReview.update(linkedContentReviewId, { title: newTitle });
        }
    });
    /**
     * Link created workflow to associated pages.
     */
    apw.workflow.onAfterWorkflowCreate.subscribe(async ({ workflow }) => {
        const { scope } = workflow;
        /**
         * If the workflow has pages in it's scope, we'll link that workflow for each of those pages.
         */
        if (hasPages(workflow)) {
            const pages = get(scope, "data.pages");

            for (const pid of pages) {
                await updatePageSettings({
                    getPage,
                    updatePage,
                    uniquePageId: pid,
                    getNewSettings: settings => {
                        return set(settings, "apw.workflowId", workflow.id);
                    }
                });
            }
        }
    });
    /**
     * Link updated workflow to associated pages.
     */
    apw.workflow.onAfterWorkflowUpdate.subscribe(async ({ workflow, original }) => {
        const { scope } = workflow;
        const { scope: prevScope } = original;
        /**
         * If the workflow has pages in it's scope and there is a change in that page list,
         * we'll update the workflow link for corresponding pages.
         */
        if (hasPages(workflow) && shouldUpdatePages(scope, prevScope)) {
            const previousPages = get(prevScope, "data.pages");
            const currentPages = get(scope, "data.pages");

            const { removedPages, addedPages } = getPagesDiff(currentPages, previousPages);
            for (const pid of addedPages) {
                await updatePageSettings({
                    getPage,
                    updatePage,
                    uniquePageId: pid,
                    getNewSettings: settings => {
                        return set(settings, "apw.workflowId", workflow.id);
                    }
                });
            }
            for (const pid of removedPages) {
                await updatePageSettings({
                    getPage,
                    updatePage,
                    uniquePageId: pid,
                    getNewSettings: settings => {
                        return set(settings, "apw.workflowId", null);
                    }
                });
            }
        }
    });
};

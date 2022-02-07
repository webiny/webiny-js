import get from "lodash/get";
import {
    LifeCycleHookCallbackParams,
    ApwOnBeforePageCreateTopicParams,
    ApwOnBeforePageCreateFromTopicParams,
    ApwOnBeforePageUpdateTopicParams
} from "~/types";
import { PageBuilderContextObject } from "@webiny/api-page-builder/graphql/types";
import {
    getPagesDiff,
    hasPages,
    setPageWorkflowId,
    shouldUpdatePages,
    assignWorkflowToPage
} from "./utils";

export interface PageMethods {
    getPage: PageBuilderContextObject["getPage"];
    updatePage: PageBuilderContextObject["updatePage"];
    onBeforePageCreate: PageBuilderContextObject["onBeforePageCreate"];
    onBeforePageCreateFrom: PageBuilderContextObject["onBeforePageCreateFrom"];
    onBeforePageUpdate: PageBuilderContextObject["onBeforePageUpdate"];
}

export const linkWorkflowToPage = ({
    apw,
    getPage,
    updatePage,
    onBeforePageCreate,
    onBeforePageCreateFrom,
    onBeforePageUpdate
}: LifeCycleHookCallbackParams & PageMethods) => {
    // TODO: @ashutosh move PB specific code into "api-apw-page-builder" package
    onBeforePageCreate.subscribe<ApwOnBeforePageCreateTopicParams>(async ({ page }) => {
        await assignWorkflowToPage({ listWorkflow: apw.workflow.list, page });
    });
    onBeforePageCreateFrom.subscribe<ApwOnBeforePageCreateFromTopicParams>(async params => {
        const { page, original } = params;
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
            for (const pid of scope.data.pages) {
                await setPageWorkflowId({
                    getPage,
                    updatePage,
                    uniquePageId: pid,
                    workflowId: workflow.id
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
            const previousPages = prevScope.data.pages;
            const currentPages = scope.data.pages;

            const { removedPages, addedPages } = getPagesDiff(currentPages, previousPages);
            for (const pid of addedPages) {
                await setPageWorkflowId({
                    getPage,
                    updatePage,
                    uniquePageId: pid,
                    workflowId: workflow.id
                });
            }
            for (const pid of removedPages) {
                await setPageWorkflowId({
                    getPage,
                    updatePage,
                    uniquePageId: pid,
                    workflowId: null
                });
            }
        }
    });
};

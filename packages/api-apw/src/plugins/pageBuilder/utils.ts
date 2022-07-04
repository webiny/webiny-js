import get from "lodash/get";
import WebinyError from "@webiny/error";
import {
    ApwWorkflow,
    ApwWorkflowApplications,
    ApwWorkflowCrud,
    ApwWorkflowScope,
    PageWithWorkflow,
    WorkflowScopeTypes
} from "~/types";
import { workflowByCreatedOnDesc, workflowByPrecedenceDesc } from "~/plugins/utils";
import { PageBuilderContextObject } from "@webiny/api-page-builder/graphql/types";

const isWorkflowApplicable = (page: PageWithWorkflow, workflow: ApwWorkflow) => {
    const application = workflow.app;
    if (application !== ApwWorkflowApplications.PB) {
        return false;
    }

    const scopeType = workflow.scope.type;

    if (scopeType === WorkflowScopeTypes.DEFAULT) {
        return true;
    } else if (scopeType === WorkflowScopeTypes.CUSTOM) {
        const categories = get(workflow, "scope.data.categories");

        if (Array.isArray(categories) && categories.includes(page.category)) {
            return true;
        }

        const pages = get(workflow, "scope.data.pages");
        if (Array.isArray(pages) && pages.includes(page.pid)) {
            return true;
        }
        return false;
    }
    throw new WebinyError(`Unknown scope type "${scopeType}".`, "UNKNOWN_SCOPE_TYPE", {
        workflow
    });
};

interface AssignWorkflowToPageParams {
    listWorkflow: ApwWorkflowCrud["list"];
    page: PageWithWorkflow;
}

export const assignWorkflowToPage = async ({ listWorkflow, page }: AssignWorkflowToPageParams) => {
    /**
     * Lookup and assign "workflowId".
     */
    try {
        /*
         * List all workflows for app pageBuilder
         */
        const [entries] = await listWorkflow({
            where: {
                app: ApwWorkflowApplications.PB
            }
        });

        /*
         *  Re-order them based on workflow scope and pre-defined rule i.e.
         *  "specific" entry -> entry for a "category" -> "default".
         *  There can be more than one workflow with same "scope" and "app".
         *  Therefore, we are also sorting the workflows by `createdOn` to get the latest workflow.
         */
        const sortedWorkflows = entries
            .sort(workflowByPrecedenceDesc)
            .sort(workflowByCreatedOnDesc);

        for (const workflow of sortedWorkflows) {
            /**
             * Assign the first applicable workflow to the page and exit.
             */
            if (isWorkflowApplicable(page, workflow)) {
                page.settings.apw = {
                    workflowId: workflow.id,
                    contentReviewId: null
                };
                break;
            }
        }
    } catch (e) {
        throw new WebinyError(`Failed to assign workflow to page "${page.pid}".`, e.code, e.data);
    }
};

export const hasPages = (workflow: ApwWorkflow): Boolean => {
    const { app, scope } = workflow;
    return (
        app === ApwWorkflowApplications.PB &&
        scope.type === WorkflowScopeTypes.CUSTOM &&
        scope.data &&
        Array.isArray(scope.data.pages)
    );
};

export const shouldUpdatePages = (
    scope: ApwWorkflowScope,
    prevScope: ApwWorkflowScope
): Boolean => {
    /**
     * Bail out early if the scope is not "CUSTOM" - at that point all pages should be updated.
     */
    if (prevScope.type !== WorkflowScopeTypes.CUSTOM) {
        return true;
    }
    const prevScopePages: string[] = get(prevScope, "data.pages");
    const currentScopePages: string[] = get(scope, "data.pages");
    /**
     * Bail out early if there were no pages assigned previously.
     */
    if (prevScopePages.length === 0) {
        return true;
    }
    /**
     * Bail out early if number of pages has been changed.
     */
    if (currentScopePages.length !== prevScopePages.length) {
        return true;
    }
    /*
     * Check whether previous scope has the exactly same pages as in the new scope.
     */
    return !prevScopePages.every(pid => currentScopePages.includes(pid));
};

interface GetUpdatePageOpsResult {
    addedPages: string[];
    removedPages: string[];
}

export const getPagesDiff = (
    currentPages: string[],
    prevPages: string[]
): GetUpdatePageOpsResult => {
    const addedPages = currentPages.filter(id => !prevPages.includes(id));
    const removedPages = prevPages.filter(id => !currentPages.includes(id));

    return {
        addedPages,
        removedPages
    };
};

interface UpdatePageSettingsParams {
    getPage: PageBuilderContextObject["getPage"];
    updatePage: PageBuilderContextObject["updatePage"];
    uniquePageId: string;
    getNewSettings: (settings: PageWithWorkflow["settings"]) => PageWithWorkflow["settings"];
}

export const updatePageSettings = async ({
    getPage,
    updatePage,
    uniquePageId,
    getNewSettings
}: UpdatePageSettingsParams) => {
    try {
        /**
         * Currently, we only assign "workflow" to latest page.
         */
        const page = await getPage<PageWithWorkflow>(uniquePageId);
        /**
         * We can't update a page that is "locked".
         */
        if (page.locked) {
            return;
        }
        /**
         * There can be more than one workflow with same `scope` for same `app`. That is why;
         * We'll update the workflow reference even though it already had one assign.
         */
        await updatePage(page.id, {
            settings: getNewSettings(page.settings)
        });
    } catch (e) {
        if (e.code !== "NOT_FOUND") {
            throw e;
        }
    }
};

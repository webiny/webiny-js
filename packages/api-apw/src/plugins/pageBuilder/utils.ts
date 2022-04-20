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
import { ApwPageBuilderMethods } from ".";

const WORKFLOW_PRECEDENCE = {
    [WorkflowScopeTypes.DEFAULT]: 0,
    [WorkflowScopeTypes.PB]: 1,
    [WorkflowScopeTypes.CMS]: 1
};

const workflowByPrecedenceDesc = (a: ApwWorkflow, b: ApwWorkflow) => {
    const scoreA = WORKFLOW_PRECEDENCE[a.scope.type];
    const scoreB = WORKFLOW_PRECEDENCE[b.scope.type];
    /**
     * In descending order of workflow precedence.
     */
    return scoreB - scoreA;
};

const workflowByCreatedOnDesc = (a: ApwWorkflow, b: ApwWorkflow) => {
    const createdOnA = get(a, "createdOn");
    const createdOnB = get(b, "createdOn");
    /**
     * In descending order of workflow createdOn i.e. the most recent one first.
     */
    return new Date(createdOnB).getTime() - new Date(createdOnA).getTime();
};

const isWorkflowApplicable = (page: PageWithWorkflow, workflow: ApwWorkflow) => {
    const application = workflow.app;
    if (application !== ApwWorkflowApplications.PB) {
        return false;
    }

    const scopeType = workflow.scope.type;

    if (scopeType === WorkflowScopeTypes.DEFAULT) {
        return true;
    }

    if (scopeType === WorkflowScopeTypes.PB) {
        const categories = get(workflow, "scope.data.categories");

        if (Array.isArray(categories) && categories.includes(page.category)) {
            return true;
        }

        const pages = get(workflow, "scope.data.pages");
        if (Array.isArray(pages) && pages.includes(page.pid)) {
            return true;
        }
    }

    return false;
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
            where: { app: ApwWorkflowApplications.PB }
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
        scope.type === WorkflowScopeTypes.PB &&
        scope.data &&
        Array.isArray(scope.data.pages)
    );
};

export const shouldUpdatePages = (
    scope: ApwWorkflowScope,
    prevScope: ApwWorkflowScope
): Boolean => {
    /**
     * Bail out early if the scope was not "PB".
     */
    if (prevScope.type !== WorkflowScopeTypes.PB) {
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

interface UpdatePageSettingsParams extends Pick<ApwPageBuilderMethods, "getPage" | "updatePage"> {
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

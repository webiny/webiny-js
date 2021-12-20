import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";
import get from "lodash/get";
import WebinyError from "@webiny/error";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { ApwContext, ApwWorkflowApplications, PageWithWorkflow, WorkflowScopeTypes } from "~/types";
import { OnBeforePageCreateTopicParams } from "@webiny/api-page-builder/graphql/types";

const WORKFLOW_PRECEDENCE = {
    [WorkflowScopeTypes.DEFAULT]: 0,
    [WorkflowScopeTypes.PB]: 1,
    [WorkflowScopeTypes.CMS]: 1
};

const getValue = (object: Record<string, any>, key: string) => {
    return get(object, `values.${key}`);
};

const workflowByPrecedenceDesc = (a, b) => {
    const scoreA = WORKFLOW_PRECEDENCE[getValue(a, "scope.type")];
    const scoreB = WORKFLOW_PRECEDENCE[getValue(b, "scope.type")];
    /**
     * In descending order of workflow precedence.
     */
    return scoreB - scoreA;
};

const workflowByCreatedOnDesc = (a, b) => {
    const createdOnA = get(a, "createdOn");
    const createdOnB = get(b, "createdOn");
    /**
     * In descending order of workflow createdOn i.e. the most recent one first.
     */
    return new Date(createdOnB).getTime() - new Date(createdOnA).getTime();
};

const isWorkflowApplicable = (page, workflow) => {
    const application = getValue(workflow, "app");
    if (application !== ApwWorkflowApplications.PB) {
        return false;
    }

    const scopeType = getValue(workflow, "scope.type");

    if (scopeType === WorkflowScopeTypes.DEFAULT) {
        return true;
    }

    if (scopeType === WorkflowScopeTypes.PB) {
        const categories = getValue(workflow, "scope.data.categories");

        if (Array.isArray(categories) && categories.includes(page.category)) {
            return true;
        }

        const pages = getValue(workflow, "scope.data.pages");
        if (Array.isArray(pages) && pages.includes(page.pid)) {
            return true;
        }
    }

    return false;
};

export default () => [
    new GraphQLSchemaPlugin({
        typeDefs: /* GraphQL */ `
            extend type PbPage {
                workflow: ID
            }
        `
    }),
    /*
     TODO: @ashutosh Make it configurable so that in case of `api-page-builder-so-ddb-es`,
      this plugin will be included automatically.
     This step is only required if you're using DynamoDB + ElasticSearch setup and you want
     to be able to get the value of the `special` field while listing pages.
     With this plugin, we ensure that the value of the `special` field is also stored in
     ElasticSearch, which is where the data is being retrieved from while listing pages.
    */
    // new IndexPageDataPlugin<PageWithWorkflow>(({ data, page }) => {
    //     // `data` represents the current page's data that will be stored in ElasticSearch.
    //     // Let's modify it, by adding the value of the new `special` flag to it.
    //     data.workflow = page.workflow;
    // }),
    new ContextPlugin<ApwContext>(context => {
        const { pageBuilder, cms, apw } = context;

        pageBuilder.onBeforePageCreate.subscribe(
            async (event: OnBeforePageCreateTopicParams<PageWithWorkflow>) => {
                const { page } = event;
                try {
                    /*
                     * List all workflows for app pageBuilder
                     */
                    const [entries] = await apw.workflow.list({
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
                         * We workflow if applicable to this page, we're done here.
                         * Assign the workflow to the page and exit.
                         */
                        if (isWorkflowApplicable(page, workflow)) {
                            page.workflow = workflow.id;
                            break;
                        }
                    }
                } catch (e) {
                    throw new WebinyError(
                        `Failed to assign workflow to page "${page.pid}".`,
                        e.code,
                        e.data
                    );
                }
            }
        );

        cms.onAfterEntryCreate.subscribe(async ({ model, entry }) => {
            if (model.modelId !== "apwWorkflowModelDefinition") {
                return;
            }

            const scope = getValue(entry, "scope");
            const app = getValue(entry, "app");

            if (
                app === ApwWorkflowApplications.PB &&
                scope.type === WorkflowScopeTypes.PB &&
                scope.data &&
                Array.isArray(scope.data.pages)
            ) {
                for (const pid of scope.data.pages) {
                    try {
                        /**
                         * Currently, we only assign "workflow" to latest page.
                         */
                        const page = await pageBuilder.getPage<PageWithWorkflow>(pid);
                        /**
                         * There can be more than one workflow with same `scope` for same `app`. That is why;
                         * We'll update the workflow reference even though it already had one assign.
                         */
                        await pageBuilder.updatePage(page.id, {
                            workflow: entry.id
                        });
                    } catch (e) {
                        if (e.code !== "NOT_FOUND") {
                            throw e;
                        }
                    }
                }
            }
        });
    })
];

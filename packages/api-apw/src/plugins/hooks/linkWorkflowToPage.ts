import { PagePlugin } from "@webiny/api-page-builder/plugins/PagePlugin";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";
import get from "lodash/get";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { CmsContext } from "@webiny/api-headless-cms/types";
import { PbContext } from "@webiny/api-page-builder/graphql/types";
import { PageWithWorkflow, WorkflowScopeTypes } from "~/types";

const WORKFLOW_PRECEDENCE = {
    [WorkflowScopeTypes.DEFAULT]: 0,
    [WorkflowScopeTypes.PB_CATEGORY]: 1,
    [WorkflowScopeTypes.CMS_MODEL]: 1,
    [WorkflowScopeTypes.SPECIFIC]: 2
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
    const scopeType = getValue(workflow, "scope.type");
    if (scopeType === WorkflowScopeTypes.SPECIFIC) {
        const values = getValue(workflow, "scope.data.values");
        return values && values.includes(page.pid);
    }

    if (scopeType === WorkflowScopeTypes.PB_CATEGORY) {
        const values = getValue(workflow, "scope.data.values");
        return values && values.includes(page.category);
    }

    return getValue(workflow, "app") === "pageBuilder";
};

export default () => [
    new GraphQLSchemaPlugin({
        typeDefs: /* GraphQL */ `
            extend type PbPage {
                workflow: ID
            }
        `
    }),
    new PagePlugin<PageWithWorkflow>({
        // Why does Page is not generic here?
        beforeCreate: async ({ context, page }) => {
            // 1. Check if the page already has `workflow` assigned
            if (page.workflow) {
                console.warn(
                    `Page "${page.pid}" already had a workflow "${page.workflow}" assigned!`
                );
                return;
            }
            try {
                // 2. List all workflows for app pageBuilder
                const model = await context.cms.getModel("apwWorkflowModelDefinition");
                const [entries] = await context.cms.listEntries(model, {
                    where: { app: "pageBuilder" }
                });

                /*
                 3. Re-order them based on workflow scope and pre-defined rule i.e.
                 "specific" entry -> entry for a "category" -> "default".
                 There can be more than one workflow with same "scope" and "app".
                 Therefore, we are also sorting the workflows by `createdOn` to get the latest workflow.
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
                console.log("Failed to assign workflow to page: ", page.id);
                console.log(e.message);
                console.log(e);
            }
        }
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
    new ContextPlugin<CmsContext & PbContext>(async context => {
        context.cms.onAfterEntryCreate.subscribe(async ({ model, entry }) => {
            if (model.modelId !== "apwWorkflowModelDefinition") {
                return;
            }

            const scope = getValue(entry, "scope");
            const app = getValue(entry, "app");

            if (
                app === "pageBuilder" &&
                scope.type === WorkflowScopeTypes.SPECIFIC &&
                scope.data &&
                Array.isArray(scope.data.values)
            ) {
                for (const pid of scope.data.values) {
                    try {
                        /**
                         * Currently, we only assign "workflow" to latest page.
                         */
                        const page = await context.pageBuilder.pages.get<PageWithWorkflow>(pid);
                        /**
                         * TODO: @ashutosh What will happen if more than one workflow with same `scope` is created?
                         * We'll update the workflow reference even though it already had one assign.
                         */
                        if (page.workflow) {
                            console.warn(
                                `Overriding workflow "${page.workflow}" for page "${pid}".`
                            );
                        }
                        await context.pageBuilder.pages.update(page.id, {
                            workflow: entry.id
                        });
                    } catch (e) {
                        console.info(
                            `Failed to assign workflow to page "${pid}".`,
                            e.message,
                            e.code
                        );
                    }
                }
            }
        });
    })
];

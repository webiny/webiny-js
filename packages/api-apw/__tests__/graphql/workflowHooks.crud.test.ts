import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import getMocks from "./mocks/workflows";

const MOCKS = getMocks();

describe("Workflow crud test", () => {
    const options = {
        path: "manage/en-US"
    };

    const { createWorkflowMutation, listWorkflowsQuery, createCategory, createPage, until } =
        useContentGqlHandler({
            ...options
        });

    const setupCategory = async () => {
        const [createCategoryResponse] = await createCategory({
            data: {
                name: "Static",
                url: "/static/",
                slug: "static",
                layout: "static"
            }
        });
        return createCategoryResponse.data.pageBuilder.createCategory.data;
    };

    test("Page should have a workflow assigned right after create", async () => {
        const category = await setupCategory();
        const workflows = [];
        /*
         Create 5 workflow entries
        */
        for (let i = 0; i < 5; i++) {
            const [createWorkflowResponse] = await createWorkflowMutation({
                data: MOCKS.createWorkflow({
                    title: `Main review workflow - ${i + 1}`,
                    app: i % 2 === 0 ? "pageBuilder" : "cms",
                    scope: MOCKS.scopes[i]
                })
            });
            const workflow =
                createWorkflowResponse.data.advancedPublishingWorkflow.createWorkflow.data;
            workflows.push(workflow);
        }

        await until(
            () => listWorkflowsQuery({}).then(([data]) => data),
            listWorkflowsResponse =>
                listWorkflowsResponse.data.advancedPublishingWorkflow.listWorkflows.data.length ===
                5
        );
        /**
         * Create a page and see what workflow has been assigned to it
         */
        const [createPageResponse] = await createPage({ category: category.slug });

        expect(createPageResponse.data.pageBuilder.createPage.data.category.slug).toEqual(
            category.slug
        );

        expect(createPageResponse.data.pageBuilder.createPage.data.workflow).toEqual(
            workflows[0].id
        );
    });

    test("Page should have the latest created workflow assigned in case of multiple matching workflows", async () => {
        const category = await setupCategory();
        const workflows = [];
        const workflowScopes = MOCKS.getPageBuilderScope("", "static");
        /*
         Create 5 workflow entries
        */
        for (let i = 0; i < 5; i++) {
            const [createWorkflowResponse] = await createWorkflowMutation({
                data: MOCKS.createWorkflow({
                    title: `Main review workflow - ${i + 1}`,
                    app: "pageBuilder",
                    scope: workflowScopes[i]
                })
            });

            const workflow =
                createWorkflowResponse.data.advancedPublishingWorkflow.createWorkflow.data;
            workflows.push(workflow);
        }

        await until(
            () => listWorkflowsQuery({}).then(([data]) => data),
            listWorkflowsResponse =>
                listWorkflowsResponse.data.advancedPublishingWorkflow.listWorkflows.data.length ===
                5
        );
        /**
         * Create a page and see what workflow has been assigned to it
         */
        const [createPageResponse] = await createPage({ category: category.slug });

        expect(createPageResponse.data.pageBuilder.createPage.data.category.slug).toEqual(
            category.slug
        );

        expect(createPageResponse.data.pageBuilder.createPage.data.workflow).toEqual(
            workflows[3].id
        );
    });

    test("Page should not have a workflow assigned in case of no workflow exist", async () => {
        const category = await setupCategory();

        // Create a workflow entry
        const [createWorkflowResponse] = await createWorkflowMutation({
            data: {
                ...MOCKS.workflow1,
                app: "cms"
            }
        });
        const workflow = createWorkflowResponse.data.advancedPublishingWorkflow.createWorkflow.data;

        await until(
            () => listWorkflowsQuery({}).then(([data]) => data),
            listWorkflowsResponse =>
                listWorkflowsResponse.data.advancedPublishingWorkflow.listWorkflows.data.length ===
                1
        );

        // List workflows
        const [listWorkflowsResponse] = await listWorkflowsQuery({});
        expect(listWorkflowsResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    listWorkflows: {
                        data: [workflow],
                        error: null,
                        meta: {
                            totalCount: 1,
                            hasMoreItems: false,
                            cursor: null
                        }
                    }
                }
            }
        });
        // Create a page and check if there is a workflow assigned
        const [createPageResponse] = await createPage({ category: category.slug });

        expect(createPageResponse.data.pageBuilder.createPage.data.category.slug).toEqual(
            category.slug
        );

        expect(createPageResponse.data.pageBuilder.createPage.data.workflow).toEqual(null);
    });
});

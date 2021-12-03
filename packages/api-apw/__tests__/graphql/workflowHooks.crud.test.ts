import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import mocks from "./mocks/workflows";

describe("Workflow assignment to a PB Page test", () => {
    const options = {
        path: "manage/en-US"
    };

    const {
        createWorkflowMutation,
        listWorkflowsQuery,
        createCategory,
        createPage,
        getPageQuery,
        until,
        reviewer: reviewerGQL,
        securityIdentity
    } = useContentGqlHandler({
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

    const login = async () => {
        await securityIdentity.login();
    };

    const setupReviewer = async () => {
        await login();
        const [listReviewersResponse] = await reviewerGQL.listReviewersQuery({});
        const [reviewer] = listReviewersResponse.data.advancedPublishingWorkflow.listReviewers.data;
        return reviewer;
    };

    test("Page should have a workflow assigned right after create", async () => {
        const reviewer = await setupReviewer();
        const category = await setupCategory();
        const workflows = [];
        /*
         Create 5 workflow entries
        */
        for (let i = 0; i < 5; i++) {
            const [createWorkflowResponse] = await createWorkflowMutation({
                data: mocks.createWorkflow(
                    {
                        title: `Main review workflow - ${i + 1}`,
                        app: i % 2 === 0 ? "pageBuilder" : "cms",
                        scope: mocks.scopes[i]
                    },
                    [reviewer]
                )
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
        const reviewer = await setupReviewer();
        const category = await setupCategory();
        const workflows = [];
        const workflowScopes = mocks.getPageBuilderScope("", "static");
        /*
         Create 5 workflow entries
        */
        for (let i = 0; i < 5; i++) {
            const [createWorkflowResponse] = await createWorkflowMutation({
                data: mocks.createWorkflow(
                    {
                        title: `Main review workflow - ${i + 1}`,
                        app: "pageBuilder",
                        scope: workflowScopes[i]
                    },
                    [reviewer]
                )
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
        const reviewer = await setupReviewer();
        const category = await setupCategory();

        // Create a workflow entry
        const [createWorkflowResponse] = await createWorkflowMutation({
            data: {
                ...mocks.createWorkflow({}, [reviewer]),
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

    test("Page should have the workflow assigned even when the workflow is created after page", async () => {
        const reviewer = await setupReviewer();
        const category = await setupCategory();

        /**
         * Create a page even before a workflow is created.
         */
        const [createPageResponse] = await createPage({ category: category.slug });
        const page = createPageResponse.data.pageBuilder.createPage.data;
        expect(page.category.slug).toEqual(category.slug);
        expect(page.workflow).toEqual(null);

        /*
         Create a workflow.
        */
        const [createWorkflowResponse] = await createWorkflowMutation({
            data: mocks.createWorkflow(
                {
                    title: `Main review workflow`,
                    app: "pageBuilder",
                    scope: {
                        type: "specific",
                        data: {
                            values: [page.pid]
                        }
                    }
                },
                [reviewer]
            )
        });

        const workflow = createWorkflowResponse.data.advancedPublishingWorkflow.createWorkflow.data;

        await until(
            () => listWorkflowsQuery({}).then(([data]) => data),
            listWorkflowsResponse =>
                listWorkflowsResponse.data.advancedPublishingWorkflow.listWorkflows.data.length ===
                1
        );
        /**
         * Now page should have this workflow assigned to it.
         */
        const [getPageResponse] = await getPageQuery({ id: page.id });
        expect(getPageResponse.data.pageBuilder.getPage.data.workflow).toBe(workflow.id);

        /**
         * Let's try creating one more workflow with same scope.
         */
        /*
         Create a workflow.
        */
        const [createAnotherWorkflowResponse] = await createWorkflowMutation({
            data: mocks.createWorkflow(
                {
                    title: `Main review workflow - 2`,
                    app: "pageBuilder",
                    scope: {
                        type: "specific",
                        data: {
                            values: [page.pid, page.pid + "999999"]
                        }
                    }
                },
                [reviewer]
            )
        });
        const anotherWorkflowWithSameScope =
            createAnotherWorkflowResponse.data.advancedPublishingWorkflow.createWorkflow.data;

        /**
         * Now page should have new newly created workflow assigned to it.
         */
        const [getPageResponseAgain] = await getPageQuery({ id: page.id });
        expect(getPageResponseAgain.data.pageBuilder.getPage.data.workflow).toBe(
            anotherWorkflowWithSameScope.id
        );
    });
});

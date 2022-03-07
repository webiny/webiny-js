import { setupCategory } from "../utils/helpers";
import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import mocks from "./mocks/workflows";

describe("Workflow assignment to a PB Page", () => {
    const options = {
        path: "manage/en-US"
    };

    const {
        createWorkflowMutation,
        listWorkflowsQuery,
        createCategory,
        getCategory,
        createPage,
        getPageQuery,
        until,
        reviewer: reviewerGQL,
        securityIdentity
    } = useContentGqlHandler({
        ...options
    });

    const login = async () => {
        await securityIdentity.login();
    };

    const setupReviewer = async () => {
        await login();

        await until(
            () => reviewerGQL.listReviewersQuery({}).then(([data]) => data),
            (response: any) => response.data.apw.listReviewers.data.length === 1,
            {
                name: "Wait for listReviewers"
            }
        );

        const [listReviewersResponse] = await reviewerGQL.listReviewersQuery({});
        const [reviewer] = listReviewersResponse.data.apw.listReviewers.data;
        return reviewer;
    };

    test("Page should have a workflow assigned right after create", async () => {
        const reviewer = await setupReviewer();
        const category = await setupCategory({ getCategory, createCategory });
        const workflows = [];
        /*
         Create 5 workflow entries
        */
        for (let i = 0; i < 5; i++) {
            const createWorkflowInput = mocks.createWorkflow(
                {
                    title: `Main review workflow - ${i + 1}`,
                    app: i % 2 === 0 ? "pageBuilder" : "cms",
                    scope: mocks.scopes[i]
                },
                [reviewer]
            );

            const [createWorkflowResponse] = await createWorkflowMutation({
                data: createWorkflowInput
            });
            const workflow = createWorkflowResponse.data.apw.createWorkflow.data;
            workflows.push(workflow);
        }

        await until(
            () => listWorkflowsQuery({}).then(([data]) => data),
            (response: any) => response.data.apw.listWorkflows.data.length === 5
        );
        /**
         * Create a page and see what workflow has been assigned to it
         */
        const [createPageResponse] = await createPage({ category: category.slug });
        const createdPageData = createPageResponse.data.pageBuilder.createPage.data;

        expect(createdPageData.category.slug).toEqual(category.slug);

        expect(createdPageData.settings.apw.workflowId).toEqual(workflows[0].id);
    });

    test("Page should have the latest created workflow assigned in case of multiple matching workflows", async () => {
        const reviewer = await setupReviewer();
        const category = await setupCategory({ getCategory, createCategory });
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

            const workflow = createWorkflowResponse.data.apw.createWorkflow.data;
            workflows.push(workflow);
        }

        await until(
            () => listWorkflowsQuery({}).then(([data]) => data),
            (response: any) => response.data.apw.listWorkflows.data.length === 5
        );
        /**
         * Create a page and see what workflow has been assigned to it
         */
        const [createPageResponse] = await createPage({ category: category.slug });
        const createdPageData = createPageResponse.data.pageBuilder.createPage.data;
        expect(createdPageData.category.slug).toEqual(category.slug);

        expect(createdPageData.settings.apw.workflowId).toEqual(workflows[3].id);
    });

    test("Page should not have a workflow assigned in case of no workflow exist", async () => {
        const reviewer = await setupReviewer();
        const category = await setupCategory({ getCategory, createCategory });

        // Create a workflow entry
        const [createWorkflowResponse] = await createWorkflowMutation({
            data: {
                ...mocks.createWorkflow({}, [reviewer]),
                app: "cms"
            }
        });
        const workflow = createWorkflowResponse.data.apw.createWorkflow.data;

        await until(
            () => listWorkflowsQuery({}).then(([data]) => data),
            (response: any) => response.data.apw.listWorkflows.data.length === 1
        );

        // List workflows
        const [listWorkflowsResponse] = await listWorkflowsQuery({});
        expect(listWorkflowsResponse).toEqual({
            data: {
                apw: {
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
        const createdPageData = createPageResponse.data.pageBuilder.createPage.data;
        expect(createdPageData.category.slug).toEqual(category.slug);

        expect(createdPageData.settings.apw).toEqual(null);
    });

    test("Page should have the workflow assigned even when the workflow is created after page", async () => {
        const reviewer = await setupReviewer();
        const category = await setupCategory({ getCategory, createCategory });

        /**
         * Create a page even before a workflow is created.
         */
        const [createPageResponse] = await createPage({ category: category.slug });
        const page = createPageResponse.data.pageBuilder.createPage.data;
        expect(page.category.slug).toEqual(category.slug);
        expect(page.settings.apw).toEqual(null);

        /*
         Create a workflow.
        */
        const [createWorkflowResponse] = await createWorkflowMutation({
            data: mocks.createWorkflow(
                {
                    title: `Main review workflow`,
                    app: "pageBuilder",
                    scope: {
                        type: "pb",
                        data: {
                            pages: [page.pid]
                        }
                    }
                },
                [reviewer]
            )
        });

        const workflow = createWorkflowResponse.data.apw.createWorkflow.data;

        await until(
            () => listWorkflowsQuery({}).then(([data]) => data),
            (response: any) => response.data.apw.listWorkflows.data.length === 1
        );
        /**
         * Now page should have this workflow assigned to it.
         */
        const [getPageResponse] = await getPageQuery({ id: page.id });
        expect(getPageResponse.data.pageBuilder.getPage.data.settings.apw.workflowId).toBe(
            workflow.id
        );

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
                        type: "pb",
                        data: {
                            pages: [page.pid, page.pid + "999999"]
                        }
                    }
                },
                [reviewer]
            )
        });
        const anotherWorkflowWithSameScope =
            createAnotherWorkflowResponse.data.apw.createWorkflow.data;

        /**
         * Now page should have new newly created workflow assigned to it.
         */
        const [getPageResponseAgain] = await getPageQuery({ id: page.id });
        expect(getPageResponseAgain.data.pageBuilder.getPage.data.settings.apw.workflowId).toBe(
            anotherWorkflowWithSameScope.id
        );
    });
});

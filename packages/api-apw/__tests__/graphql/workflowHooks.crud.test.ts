import { setupCategory } from "../utils/helpers";
import { usePageBuilderHandler } from "../utils/usePageBuilderHandler";
import mocks from "./mocks/workflows";
import { ApwWorkflowApplications, WorkflowScopeTypes } from "~/types";

describe("Workflow assignment to a PB Page", () => {
    const options = {
        path: "manage/en-US"
    };

    const {
        createWorkflowMutation,
        updateWorkflowMutation,
        listWorkflowsQuery,
        getWorkflowQuery,
        createCategory,
        getCategory,
        createPage,
        getPageQuery,
        publishPage,
        until,
        reviewer: reviewerGQL,
        securityIdentity
    } = usePageBuilderHandler({
        ...options
    });

    const login = async () => {
        return await securityIdentity.login();
    };

    const setupReviewer = async () => {
        await login();

        await until(
            () => reviewerGQL.listReviewersQuery({}).then(([data]) => data),
            (response: any) => {
                return response.data.apw.listReviewers.data.length === 1;
            },
            {
                name: "Wait for listReviewers"
            }
        );

        const [listReviewersResponse] = await reviewerGQL.listReviewersQuery({});
        const [reviewer] = listReviewersResponse.data.apw.listReviewers.data;
        return reviewer;
    };

    const setup = async () => {
        const reviewer = await setupReviewer();
        const category = await setupCategory({ getCategory, createCategory });

        return {
            reviewer,
            category
        };
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
                    app: i % 2 === 0 ? ApwWorkflowApplications.PB : ApwWorkflowApplications.CMS,
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
        const [firstWorkflow] = workflows;
        /**
         * Create a page and see what workflow has been assigned to it
         */
        const [createPageResponse] = await createPage({ category: category.slug });
        const createdPageData = createPageResponse.data.pageBuilder.createPage.data;

        expect(createdPageData.category.slug).toEqual(category.slug);

        expect(createdPageData.settings.apw.workflowId).toEqual(firstWorkflow.id);

        /**
         * New revision should also has the workflow assigned.
         */
        const [createPageFromResponse] = await createPage({
            from: createdPageData.id,
            category: category.slug
        });
        const newRevisionData = createPageFromResponse.data.pageBuilder.createPage.data;
        expect(newRevisionData.settings.apw.workflowId).toEqual(firstWorkflow.id);
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
                        app: ApwWorkflowApplications.PB,
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
                ...mocks.createWorkflow(
                    {
                        app: ApwWorkflowApplications.CMS
                    },
                    [reviewer]
                )
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
                    app: ApwWorkflowApplications.PB,
                    scope: {
                        type: WorkflowScopeTypes.CUSTOM,
                        data: {
                            entries: [],
                            models: [],
                            categories: [],
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

        const [listWorkflowsResponse] = await listWorkflowsQuery();

        expect(listWorkflowsResponse).toEqual({
            data: {
                apw: {
                    listWorkflows: {
                        data: [
                            {
                                ...workflow
                            }
                        ],
                        meta: {
                            totalCount: 1,
                            cursor: null,
                            hasMoreItems: false
                        },
                        error: null
                    }
                }
            }
        });
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
                    app: ApwWorkflowApplications.PB,
                    scope: {
                        type: WorkflowScopeTypes.CUSTOM,
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

    test("Pages should have the workflow assigned even after the workflow has been updated", async () => {
        const { reviewer, category } = await setup();

        /**
         * Create two new pages while we don't have any workflow in the system.
         */
        const pages = [];
        for (let i = 0; i < 2; i++) {
            const [createPageResponse] = await createPage({ category: category.slug });
            const page = createPageResponse.data.pageBuilder.createPage.data;
            expect(page.category.slug).toEqual(category.slug);
            expect(page.settings.apw).toEqual(null);
            /*
             * Save it for later
             */
            pages.push(page);
        }
        const [firstPage, secondPage] = pages;
        /*
         Create a workflow and add first page in its scope.
        */
        const [createWorkflowResponse] = await createWorkflowMutation({
            data: mocks.createWorkflow(
                {
                    title: `Main review workflow`,
                    app: ApwWorkflowApplications.PB,
                    scope: {
                        type: WorkflowScopeTypes.CUSTOM,
                        data: {
                            pages: [firstPage.pid]
                        }
                    }
                },
                [reviewer]
            )
        });
        expect(createWorkflowResponse).toEqual({
            data: {
                apw: {
                    createWorkflow: {
                        data: expect.any(Object),
                        error: null
                    }
                }
            }
        });

        await until(
            () => listWorkflowsQuery({}).then(([data]) => data),
            (response: any) => response.data.apw.listWorkflows.data.length === 1
        );

        const workflow = createWorkflowResponse.data.apw.createWorkflow.data;

        /**
         * Now first page should have this workflow assigned to it.
         */
        const [getPageResponse] = await getPageQuery({ id: firstPage.id });
        expect(getPageResponse.data.pageBuilder.getPage.data.settings.apw).toEqual({
            workflowId: workflow.id,
            contentReviewId: null
        });

        /**
         * Let's update the workflow scope.
         */
        const [updateWorkflowResponse] = await updateWorkflowMutation({
            id: workflow.id,
            data: {
                title: workflow.title,
                steps: workflow.steps,
                scope: {
                    type: WorkflowScopeTypes.CUSTOM,
                    data: {
                        pages: [secondPage.pid]
                    }
                }
            }
        });

        await until(
            () => getWorkflowQuery({ id: workflow.id }).then(([data]) => data),
            (response: any) => response.data.apw.getWorkflow.data.savedOn !== workflow.savedOn,
            {
                name: "Wait for getWorkflow query"
            }
        );

        const updatedWorkflow = updateWorkflowResponse.data.apw.updateWorkflow.data;
        expect(updatedWorkflow).toEqual({
            id: expect.any(String),
            createdOn: expect.stringMatching(/^20/),
            savedOn: expect.stringMatching(/^20/),
            createdBy: {
                id: "12345678",
                displayName: "John Doe",
                type: "admin"
            },
            app: expect.any(String),
            title: expect.any(String),
            steps: [
                {
                    title: expect.any(String),
                    id: expect.any(String),
                    type: expect.any(String),
                    reviewers: [expect.any(String)]
                }
            ],
            scope: {
                type: expect.any(String),
                data: {
                    pages: [secondPage.pid]
                }
            }
        });
        /**
         * Now second page should have this workflow assigned to it.
         */
        const [getSecondPageResponse] = await getPageQuery({ id: secondPage.id });
        expect(getSecondPageResponse.data.pageBuilder.getPage.data.settings.apw).toEqual({
            workflowId: workflow.id,
            contentReviewId: null
        });
    });

    test(`Assign workflow to a "published" page`, async () => {
        const { reviewer, category } = await setup();

        /**
         * Create two new pages while we don't have any workflow in the system.
         */
        const pages = [];
        for (let i = 0; i < 2; i++) {
            const [createPageResponse] = await createPage({ category: category.slug });
            const page = createPageResponse.data.pageBuilder.createPage.data;
            expect(page.category.slug).toEqual(category.slug);
            expect(page.settings.apw).toEqual(null);
            /*
             * Save it for later
             */
            pages.push(page);
        }
        const [firstPage, secondPage] = pages;
        /**
         * Let's publish the second page.
         */
        const [publishPageResponse] = await publishPage({ id: secondPage.id });
        expect(publishPageResponse).toEqual({
            data: {
                pageBuilder: {
                    publishPage: {
                        data: expect.any(Object),
                        error: null
                    }
                }
            }
        });

        /*
         Create a workflow and add both pages in its scope.
        */
        const [createWorkflowResponse] = await createWorkflowMutation({
            data: mocks.createWorkflow(
                {
                    title: `Main review workflow`,
                    app: ApwWorkflowApplications.PB,
                    scope: {
                        type: WorkflowScopeTypes.CUSTOM,
                        data: {
                            pages: [firstPage.pid, secondPage.pid]
                        }
                    }
                },
                [reviewer]
            )
        });
        expect(createWorkflowResponse).toEqual({
            data: {
                apw: {
                    createWorkflow: {
                        data: expect.any(Object),
                        error: null
                    }
                }
            }
        });

        await until(
            () => listWorkflowsQuery({}).then(([data]) => data),
            (response: any) => response.data.apw.listWorkflows.data.length === 1
        );

        const workflow = createWorkflowResponse.data.apw.createWorkflow.data;

        /**
         * Now first page should have this workflow assigned to it.
         */
        const [getPageResponse] = await getPageQuery({ id: firstPage.id });
        expect(getPageResponse.data.pageBuilder.getPage.data.settings.apw).toEqual({
            workflowId: workflow.id,
            contentReviewId: null
        });

        /**
         * But, second page should not have this workflow assigned to it.
         */
        const [getSecondPageResponse] = await getPageQuery({ id: secondPage.id });
        expect(getSecondPageResponse.data.pageBuilder.getPage.data.settings.apw).toBe(null);

        /**
         * Now, let's create a new revision of the second page i.e. published page.
         */
        const [createPageFromResponse] = await createPage({
            from: secondPage.id,
            category: category.slug
        });
        expect(createPageFromResponse).toEqual({
            data: {
                pageBuilder: {
                    createPage: {
                        data: expect.any(Object),
                        error: null
                    }
                }
            }
        });
        const secondPageNewRevision = createPageFromResponse.data.pageBuilder.createPage.data;
        /**
         * Now, it should have a workflow assigned.
         */
        expect(secondPageNewRevision.settings.apw).toEqual({
            workflowId: workflow.id,
            contentReviewId: null
        });
    });

    test(`Should remove "workflowId" from a page after workflow update`, async () => {
        const { reviewer, category } = await setup();

        /**
         * Create two new pages while we don't have any workflow in the system.
         */
        const pages = [];
        for (let i = 0; i < 2; i++) {
            const [createPageResponse] = await createPage({ category: category.slug });
            const page = createPageResponse.data.pageBuilder.createPage.data;
            expect(page.category.slug).toEqual(category.slug);
            expect(page.settings.apw).toEqual(null);
            /*
             * Save it for later
             */
            pages.push(page);
        }
        const [firstPage, secondPage] = pages;

        /*
         * Create a workflow and add both pages in its scope.
         */
        const [createWorkflowResponse] = await createWorkflowMutation({
            data: mocks.createWorkflow(
                {
                    title: `Main review workflow`,
                    app: ApwWorkflowApplications.PB,
                    scope: {
                        type: WorkflowScopeTypes.CUSTOM,
                        data: {
                            pages: [firstPage.pid, secondPage.pid]
                        }
                    }
                },
                [reviewer]
            )
        });
        expect(createWorkflowResponse).toEqual({
            data: {
                apw: {
                    createWorkflow: {
                        data: expect.any(Object),
                        error: null
                    }
                }
            }
        });

        await until(
            () => listWorkflowsQuery({}).then(([data]) => data),
            (response: any) => response.data.apw.listWorkflows.data.length === 1
        );

        const workflow = createWorkflowResponse.data.apw.createWorkflow.data;

        /**
         * Both pages should have this workflow assigned to them.
         */
        for (let i = 0; i < pages.length; i++) {
            const [getPageResponse] = await getPageQuery({ id: pages[i].id });
            expect(getPageResponse.data.pageBuilder.getPage.data.settings.apw).toEqual({
                workflowId: workflow.id,
                contentReviewId: null
            });
        }

        /**
         * Now, let's update the workflow such that second page is no longer in its scope.
         */
        const [updateWorkflowResponse] = await updateWorkflowMutation({
            id: workflow.id,
            data: {
                title: workflow.title,
                steps: workflow.steps,
                scope: {
                    type: WorkflowScopeTypes.CUSTOM,
                    data: {
                        pages: [firstPage.pid]
                    }
                }
            }
        });
        expect(updateWorkflowResponse).toEqual({
            data: {
                apw: {
                    updateWorkflow: {
                        data: {
                            id: expect.any(String),
                            createdOn: expect.stringMatching(/^20/),
                            savedOn: expect.stringMatching(/^20/),
                            createdBy: {
                                id: "12345678",
                                displayName: "John Doe",
                                type: "admin"
                            },
                            app: expect.any(String),
                            title: expect.any(String),
                            steps: [
                                {
                                    title: expect.any(String),
                                    id: expect.any(String),
                                    type: expect.any(String),
                                    reviewers: [expect.any(String)]
                                }
                            ],
                            scope: {
                                type: expect.any(String),
                                data: {
                                    pages: [firstPage.pid]
                                }
                            }
                        },
                        error: null
                    }
                }
            }
        });

        /**
         * Now only firstPage should have the workflowId attached.
         */
        const [getPageResponse] = await getPageQuery({ id: firstPage.id });
        expect(getPageResponse.data.pageBuilder.getPage.data.settings.apw).toEqual({
            workflowId: workflow.id,
            contentReviewId: null
        });

        const [getPage2Response] = await getPageQuery({ id: secondPage.id });
        expect(getPage2Response.data.pageBuilder.getPage.data.settings.apw).toEqual({
            workflowId: null,
            contentReviewId: null
        });
    });
});

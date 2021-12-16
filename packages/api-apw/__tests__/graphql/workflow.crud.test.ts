import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import mocks from "./mocks/workflows";

describe("Workflow crud test", () => {
    const options = {
        path: "manage/en-US"
    };

    const {
        getWorkflowQuery,
        listWorkflowsQuery,
        createWorkflowMutation,
        updateWorkflowMutation,
        deleteWorkflowMutation,
        securityIdentity,
        reviewer: reviewerGQL,
        until
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
            response => {
                const list = response.data.advancedPublishingWorkflow.listReviewers.data;
                return list.length >= 1;
            },
            {
                name: "Wait for listReviewers"
            }
        );

        const [listReviewersResponse] = await reviewerGQL.listReviewersQuery({});
        const [reviewer] = listReviewersResponse.data.advancedPublishingWorkflow.listReviewers.data;
        return reviewer;
    };

    test("should able to create, update, get, list and delete a workflow", async () => {
        const reviewer = await setupReviewer();
        /*
         * Create a new workflow entry.
         */
        const workflowData = mocks.createWorkflow({}, [reviewer]);
        const [createWorkflowResponse] = await createWorkflowMutation({
            data: workflowData
        });

        const workflow = createWorkflowResponse.data.advancedPublishingWorkflow.createWorkflow.data;

        expect(createWorkflowResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    createWorkflow: {
                        data: {
                            id: expect.any(String),
                            createdOn: expect.stringMatching(/^20/),
                            savedOn: expect.stringMatching(/^20/),
                            createdBy: {
                                id: "12345678",
                                displayName: "John Doe",
                                type: "admin"
                            },
                            ...workflowData
                        },
                        error: null
                    }
                }
            }
        });

        await until(
            () => getWorkflowQuery({ id: workflow.id }).then(([data]) => data),
            response => response.data.advancedPublishingWorkflow.getWorkflow.data !== null,
            {
                name: "Wait for getWorkflow query"
            }
        );

        /**
         *  Now that we have a workflow entry, we should be able to get it.
         */
        const [getWorkflowByIdResponse] = await getWorkflowQuery({ id: workflow.id });
        expect(getWorkflowByIdResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    getWorkflow: {
                        data: {
                            id: expect.any(String),
                            createdOn: expect.stringMatching(/^20/),
                            savedOn: expect.stringMatching(/^20/),
                            createdBy: {
                                id: "12345678",
                                displayName: "John Doe",
                                type: "admin"
                            },
                            ...workflow
                        },
                        error: null
                    }
                }
            }
        });
        /*
         * Should return error in case of no entry found.
         */
        const [getWorkflowResponse] = await getWorkflowQuery({ id: "123" });
        expect(getWorkflowResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    getWorkflow: {
                        data: null,
                        error: {
                            code: "NOT_FOUND",
                            data: null,
                            message: expect.any(String)
                        }
                    }
                }
            }
        });

        /**
         * Let's update the entry.
         */
        const designReviewStep = {
            title: "Design review",
            slug: "design-review",
            type: "mandatory_blocking",
            reviewers: [
                {
                    id: reviewer.id,
                    modelId: "apwReviewerModelDefinition"
                }
            ]
        };
        const [updateWorkflowResponse] = await updateWorkflowMutation({
            id: workflow.id,
            data: {
                steps: [...workflow.steps, designReviewStep]
            }
        });
        expect(updateWorkflowResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    updateWorkflow: {
                        data: {
                            ...workflow,
                            id: expect.any(String),
                            createdOn: expect.stringMatching(/^20/),
                            savedOn: expect.stringMatching(/^20/),
                            createdBy: {
                                id: "12345678",
                                displayName: "John Doe",
                                type: "admin"
                            },
                            steps: [...workflow.steps, designReviewStep]
                        },
                        error: null
                    }
                }
            }
        });

        await until(
            () => listWorkflowsQuery({}).then(([data]) => data),
            response => {
                const [updatedEntry] = response.data.advancedPublishingWorkflow.listWorkflows.data;
                return updatedEntry && workflow.savedOn !== updatedEntry.savedOn;
            },
            {
                name: "Wait for listWorkflows query after update"
            }
        );

        /**
         * Let's list all workflow entries should return only one.
         */
        const [listWorkflowsResponse] = await listWorkflowsQuery({});
        expect(listWorkflowsResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    listWorkflows: {
                        data: [
                            {
                                id: expect.any(String),
                                createdOn: expect.stringMatching(/^20/),
                                savedOn: expect.stringMatching(/^20/),
                                createdBy: {
                                    id: "12345678",
                                    displayName: "John Doe",
                                    type: "admin"
                                },
                                app: workflow.app,
                                title: workflow.title,
                                steps: [...workflow.steps, designReviewStep],
                                scope: workflow.scope
                            }
                        ],
                        error: null,
                        meta: {
                            hasMoreItems: false,
                            totalCount: 1,
                            cursor: null
                        }
                    }
                }
            }
        });

        /**
         *  Delete the only workflow entry we have.
         */
        const [deleteWorkflowResponse] = await deleteWorkflowMutation({ id: workflow.id });
        expect(deleteWorkflowResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    deleteWorkflow: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        await until(
            () => listWorkflowsQuery({}).then(([data]) => data),
            response => {
                const list = response.data.advancedPublishingWorkflow.listWorkflows.data;
                return list.length === 0;
            },
            {
                name: "Wait for listWorkflows query after delete"
            }
        );

        /**
         * Now that we've deleted the only entry we had, we should get empty list as response from "listWorkflows".
         */
        const [listWorkflowsAgainResponse] = await listWorkflowsQuery({});
        expect(listWorkflowsAgainResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    listWorkflows: {
                        data: [],
                        error: null,
                        meta: {
                            hasMoreItems: false,
                            totalCount: 0,
                            cursor: null
                        }
                    }
                }
            }
        });
    });

    test("should be able to list workflows", async () => {
        await login();
        const reviewer = await setupReviewer();
        const workflows = [];
        /*
         * Create five workflows.
         */
        for (let i = 0; i < 5; i++) {
            const [createWorkflowResponse] = await createWorkflowMutation({
                data: mocks.createWorkflow({ app: i % 2 === 0 ? "pageBuilder" : "cms" }, [reviewer])
            });

            workflows.push(
                createWorkflowResponse.data.advancedPublishingWorkflow.createWorkflow.data
            );
        }

        await until(
            () => listWorkflowsQuery({}).then(([data]) => data),
            response => {
                const list = response.data.advancedPublishingWorkflow.listWorkflows.data;
                return list.length === 5;
            },
            {
                name: "Wait for listWorkflows query"
            }
        );

        /*
         * Should list all five workflows.
         */
        const [listWorkflowsResponse] = await listWorkflowsQuery({});
        expect(listWorkflowsResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    listWorkflows: {
                        data: [...workflows.reverse()],
                        meta: {
                            hasMoreItems: false,
                            cursor: null,
                            totalCount: 5
                        },
                        error: null
                    }
                }
            }
        });

        /*
         *  Should only return workflows for "pageBuilder" app.
         */
        const [listPBWorkflowsResponse] = await listWorkflowsQuery({
            where: { app: "pageBuilder" }
        });
        expect(listPBWorkflowsResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    listWorkflows: {
                        data: [workflows[0], workflows[2], workflows[4]],
                        meta: {
                            hasMoreItems: false,
                            cursor: null,
                            totalCount: 3
                        },
                        error: null
                    }
                }
            }
        });
    });
});

import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import getMocks from "./mocks/workflows";

const MOCKS = getMocks();

describe("Workflow crud test", () => {
    const options = {
        path: "manage/en-US"
    };

    const {
        getWorkflowQuery,
        listWorkflowsQuery,
        createWorkflowMutation,
        updateWorkflowMutation,
        deleteWorkflowMutation
    } = useContentGqlHandler({
        ...options
    });
    test("should able to create, update, get, list and delete a workflow", async () => {
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
                            message: "Entry not found!"
                        }
                    }
                }
            }
        });
        /*
         * Create a new workflow entry.
         */
        const [createWorkflowResponse] = await createWorkflowMutation({
            data: MOCKS.workflow1
        });
        const { id } = createWorkflowResponse.data.advancedPublishingWorkflow.createWorkflow.data;

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
                            ...MOCKS.workflow1
                        },
                        error: null
                    }
                }
            }
        });
        /**
         *  Now that we have a workflow entry, we should be able to get it.
         */
        const [getWorkflowByIdResponse] = await getWorkflowQuery({ id: id });
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
                            ...MOCKS.workflow1
                        },
                        error: null
                    }
                }
            }
        });

        /**
         * Let's update the entry.
         */
        const [updateWorkflowResponse] = await updateWorkflowMutation({
            id,
            data: MOCKS.updatedWorkflow1
        });
        expect(updateWorkflowResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
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
                            ...MOCKS.workflow1,
                            ...MOCKS.updatedWorkflow1
                        },
                        error: null
                    }
                }
            }
        });

        /**
         * Let's list all workflow entries should return only one.
         */
        const [listWorkflowsResponse] = await listWorkflowsQuery({ where: {} });
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
                                ...MOCKS.workflow1,
                                ...MOCKS.updatedWorkflow1
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
        const [deleteWorkflowResponse] = await deleteWorkflowMutation({ id });
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

        /**
         * Now that we've deleted the only entry we had, we should get empty list as response from "listWorkflows".
         */
        const [listWorkflowsAgainResponse] = await listWorkflowsQuery({ where: {} });
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

    it("should be able to list workflows", async () => {
        const workflows = [];
        /*
         * Create five workflows.
         */
        for (let i = 0; i < 5; i++) {
            const [createWorkflowResponse] = await createWorkflowMutation({
                data: MOCKS.createWorkflow({ app: i % 2 === 0 ? "pageBuilder" : "cms" })
            });

            workflows.push(
                createWorkflowResponse.data.advancedPublishingWorkflow.createWorkflow.data
            );
        }

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

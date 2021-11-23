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
    test("should able to get workflow by Id", async () => {
        // Should return error in case of no entry found
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
        // Create a workflow entry
        const [createWorkflowResponse] = await createWorkflowMutation({
            data: MOCKS.workflow1
        });
        const { id } = createWorkflowResponse.data.advancedPublishingWorkflow.createWorkflow.data;

        expect(createWorkflowResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    createWorkflow: {
                        data: {
                            id,
                            ...MOCKS.workflow1
                        },
                        error: null
                    }
                }
            }
        });
        // Now that we have a workflow entry, we should be able to get it
        const [getWorkflowByIdResponse] = await getWorkflowQuery({ id: id });
        expect(getWorkflowByIdResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    getWorkflow: {
                        data: {
                            id,
                            ...MOCKS.workflow1
                        },
                        error: null
                    }
                }
            }
        });

        // Let's update the entry
        const [updateWorkflowResponse] = await updateWorkflowMutation({
            id,
            data: MOCKS.updatedWorkflow1
        });
        expect(updateWorkflowResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    updateWorkflow: {
                        data: {
                            id,
                            ...MOCKS.workflow1,
                            ...MOCKS.updatedWorkflow1
                        },
                        error: null
                    }
                }
            }
        });

        // Let's list all workflow entries there should be only one
        const [listWorkflowsResponse] = await listWorkflowsQuery({ where: {} });
        expect(listWorkflowsResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    listWorkflows: {
                        data: [
                            {
                                id,
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

        // Delete the only workflow entry we have
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

        // Now that we've deleted the only entry we had, we should get empty list as response from "listWorkflows"
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
});

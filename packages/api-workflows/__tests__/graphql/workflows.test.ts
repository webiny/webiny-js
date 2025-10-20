import { describe, expect, it } from "vitest";
import { createGraphQLHandler } from "~tests/__helpers/handler.js";
import type { IWorkflow } from "~/context/abstractions/Workflow.js";
import { FULL_ACCESS_TEAM_ID } from "@webiny/testing";

describe("workflow graphql", () => {
    const handler = createGraphQLHandler();

    it("should create, get, list and delete a workflow", async () => {
        const id = `workflow-1`;
        const [response] = await handler.storeWorkflow({
            app: "test",
            id,
            data: {
                name: "Test Workflow",
                steps: [
                    {
                        id: "step-1",
                        title: "Step 1",
                        description: "This is step 1",
                        color: "blue",
                        teams: [{ id: FULL_ACCESS_TEAM_ID }],
                        notifications: [{ id: "notif-1" }]
                    }
                ]
            }
        });
        const workflow = response.data?.workflows?.storeWorkflow?.data as IWorkflow;
        expect(response).toEqual({
            data: {
                workflows: {
                    storeWorkflow: {
                        data: {
                            id: "workflow-1",
                            name: "Test Workflow",
                            app: "test",
                            steps: [
                                {
                                    id: "step-1",
                                    title: "Step 1",
                                    description: "This is step 1",
                                    color: "blue",
                                    teams: [{ id: FULL_ACCESS_TEAM_ID }],
                                    notifications: [{ id: "notif-1" }]
                                }
                            ]
                        },
                        error: null
                    }
                }
            }
        });

        const [getResponse] = await handler.getWorkflow({
            app: "test",
            id: "workflow-1"
        });

        expect(getResponse).toEqual({
            data: {
                workflows: {
                    getWorkflow: {
                        data: {
                            id: "workflow-1",
                            name: "Test Workflow",
                            app: "test",
                            steps: [
                                {
                                    id: "step-1",
                                    title: "Step 1",
                                    description: "This is step 1",
                                    color: "blue",
                                    teams: [{ id: FULL_ACCESS_TEAM_ID }],
                                    notifications: [{ id: "notif-1" }]
                                }
                            ]
                        },
                        error: null
                    }
                }
            }
        });

        const [updateResponse] = await handler.storeWorkflow({
            app: "test",
            id: "workflow-1",
            data: {
                name: "Test Workflow Updated",
                steps: workflow.steps
            }
        });
        const updatedWorkflow = {
            ...workflow,
            name: "Test Workflow Updated"
        };
        expect(updateResponse).toEqual({
            data: {
                workflows: {
                    storeWorkflow: {
                        data: updatedWorkflow,
                        error: null
                    }
                }
            }
        });

        const [listResponse] = await handler.listWorkflows({
            where: {
                app: "test"
            }
        });
        expect(listResponse).toEqual({
            data: {
                workflows: {
                    listWorkflows: {
                        data: [updatedWorkflow],
                        meta: {
                            hasMoreItems: false,
                            totalCount: 1,
                            cursor: null
                        },
                        error: null
                    }
                }
            }
        });
        const [listWrongAppResponse] = await handler.listWorkflows({
            where: {
                app: "testNonExisting"
            }
        });
        expect(listWrongAppResponse).toEqual({
            data: {
                workflows: {
                    listWorkflows: {
                        data: [],
                        meta: {
                            hasMoreItems: false,
                            totalCount: 0,
                            cursor: null
                        },
                        error: null
                    }
                }
            }
        });

        const [getNonExistingResponse] = await handler.getWorkflow({
            app: "test",
            id: "non-existing"
        });
        expect(getNonExistingResponse).toEqual({
            data: {
                workflows: {
                    getWorkflow: {
                        data: null,
                        error: {
                            code: "NOT_FOUND",
                            message: 'Workflow in app "test" with id "non-existing" was not found!',
                            data: null
                        }
                    }
                }
            }
        });

        const [deleteResponse] = await handler.deleteWorkflow({
            app: "test",
            id: "workflow-1"
        });
        expect(deleteResponse).toEqual({
            data: {
                workflows: {
                    deleteWorkflow: {
                        data: true,
                        error: null
                    }
                }
            }
        });
    });

    it("should fail to delete a workflow because it does not exist", async () => {
        const [response] = await handler.deleteWorkflow({
            app: "test",
            id: "workflow-1"
        });
        expect(response).toEqual({
            data: {
                workflows: {
                    deleteWorkflow: {
                        data: null,
                        error: {
                            code: "NOT_FOUND",
                            data: null,
                            message: `Workflow in app "test" with id "workflow-1" was not found!`
                        }
                    }
                }
            }
        });
    });

    it("should fail to get a workflow because it does not exist", async () => {
        const [response] = await handler.getWorkflow({
            app: "test",
            id: "workflow-1"
        });
        expect(response).toEqual({
            data: {
                workflows: {
                    getWorkflow: {
                        data: null,
                        error: {
                            code: "NOT_FOUND",
                            data: null,
                            message: `Workflow in app "test" with id "workflow-1" was not found!`
                        }
                    }
                }
            }
        });
    });
});

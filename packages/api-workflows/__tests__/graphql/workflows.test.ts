import { describe, expect, it } from "vitest";
import { createGraphQLHandler } from "~tests/__helpers/handler.js";
import type { IWorkflow } from "~/types.js";

describe("workflow graphql", () => {
    const handler = createGraphQLHandler();

    it("should create, get, list and delete a workflow", async () => {
        const [response] = await handler.createWorkflow({
            app: "test",
            data: {
                id: "workflow-1",
                name: "Test Workflow",
                steps: [
                    {
                        id: "step-1",
                        title: "Step 1",
                        description: "This is step 1",
                        color: "blue",
                        teams: [{ id: "team-1" }],
                        notifications: [{ id: "notif-1" }]
                    }
                ]
            }
        });
        const workflow = response.data?.workflows?.createWorkflow?.data as IWorkflow;
        expect(response).toEqual({
            data: {
                workflows: {
                    createWorkflow: {
                        data: {
                            id: "workflow-1",
                            name: "Test Workflow",
                            steps: [
                                {
                                    id: "step-1",
                                    title: "Step 1",
                                    description: "This is step 1",
                                    color: "blue",
                                    teams: [{ id: "team-1" }],
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
                            steps: [
                                {
                                    id: "step-1",
                                    title: "Step 1",
                                    description: "This is step 1",
                                    color: "blue",
                                    teams: [{ id: "team-1" }],
                                    notifications: [{ id: "notif-1" }]
                                }
                            ]
                        },
                        error: null
                    }
                }
            }
        });

        const [updateResponse] = await handler.updateWorkflow({
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
                    updateWorkflow: {
                        data: updatedWorkflow,
                        error: null
                    }
                }
            }
        });

        const [listResponse] = await handler.listWorkflows({
            app: "test"
        });
        expect(listResponse).toEqual({
            data: {
                workflows: {
                    listWorkflows: {
                        data: [updatedWorkflow],
                        error: null
                    }
                }
            }
        });
        const [listWrongAppResponse] = await handler.listWorkflows({
            app: "testNonExisting"
        });
        expect(listWrongAppResponse).toEqual({
            data: {
                workflows: {
                    listWorkflows: {
                        data: [],
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

    it("should fail to create a workflow because of invalid graphql input", async () => {
        const [response] = await handler.createWorkflow({
            app: "test",
            data: {
                id: "workflow-1",
                name: "Test Workflow",
                steps: [
                    {
                        id: "step-1",
                        title: "Step 1",
                        description: "This is step 1",
                        color: "blue",
                        teams: [{ id: "team-1" }],
                        notifications: [{ id: "" }]
                    }
                ]
            }
        });
        expect(response).toEqual({
            data: {
                workflows: {
                    createWorkflow: {
                        data: null,
                        error: {
                            code: "VALIDATION_FAILED_INVALID_FIELDS",
                            data: {
                                invalidFields: {
                                    "data.steps.0.notifications.0.id": {
                                        code: "too_small",
                                        data: {
                                            path: ["data", "steps", 0, "notifications", 0, "id"]
                                        },
                                        message: "Notification ID is required."
                                    }
                                }
                            },
                            message: "Validation failed."
                        }
                    }
                }
            }
        });
    });

    it("should fail to update a workflow because of invalid graphql input", async () => {
        const [response] = await handler.updateWorkflow({
            app: "test",
            id: "workflow-1",
            data: {
                name: "Test Workflow",
                steps: [
                    {
                        id: "step-1",
                        title: "Step 1",
                        description: "This is step 1",
                        color: "blue",
                        teams: [{ id: "" }],
                        notifications: [{ id: "notif-1" }]
                    }
                ]
            }
        });
        expect(response).toEqual({
            data: {
                workflows: {
                    updateWorkflow: {
                        data: null,
                        error: {
                            code: "VALIDATION_FAILED_INVALID_FIELDS",
                            data: {
                                invalidFields: {
                                    "data.steps.0.teams.0.id": {
                                        code: "too_small",
                                        data: {
                                            path: ["data", "steps", 0, "teams", 0, "id"]
                                        },
                                        message: "Team ID is required."
                                    }
                                }
                            },
                            message: "Validation failed."
                        }
                    }
                }
            }
        });
    });

    it("should fail to delete a workflow because of invalid graphql input", async () => {
        const [response] = await handler.deleteWorkflow({
            app: "test",
            id: ""
        });
        expect(response).toEqual({
            data: {
                workflows: {
                    deleteWorkflow: {
                        data: null,
                        error: {
                            code: "VALIDATION_FAILED_INVALID_FIELDS",
                            data: {
                                invalidFields: {
                                    id: {
                                        code: "too_small",
                                        data: {
                                            path: ["id"]
                                        },
                                        message: "ID is required."
                                    }
                                }
                            },
                            message: "Validation failed."
                        }
                    }
                }
            }
        });
    });

    it("should fail to get a workflow because of invalid graphql input", async () => {
        const [response] = await handler.getWorkflow({
            app: "test",
            id: ""
        });
        expect(response).toEqual({
            data: {
                workflows: {
                    getWorkflow: {
                        data: null,
                        error: {
                            code: "VALIDATION_FAILED_INVALID_FIELDS",
                            data: {
                                invalidFields: {
                                    id: {
                                        code: "too_small",
                                        data: {
                                            path: ["id"]
                                        },
                                        message: "ID is required."
                                    }
                                }
                            },
                            message: "Validation failed."
                        }
                    }
                }
            }
        });
    });

    it("should fail to list workflows because of invalid graphql input", async () => {
        const [listResponse] = await handler.listWorkflows({
            app: ""
        });
        expect(listResponse).toEqual({
            data: {
                workflows: {
                    listWorkflows: {
                        data: null,
                        error: {
                            code: "VALIDATION_FAILED_INVALID_FIELDS",
                            data: {
                                invalidFields: {
                                    app: {
                                        code: "too_small",
                                        data: {
                                            path: ["app"]
                                        },
                                        message: "App is required."
                                    }
                                }
                            },
                            message: "Validation failed."
                        }
                    }
                }
            }
        });
    });
});

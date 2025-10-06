import { describe, expect, it } from "vitest";
import { createGraphQLHandler } from "~tests/__helpers/handler.js";

describe("workflows graphql validation", () => {
    const handler = createGraphQLHandler();

    it("should fail to create a workflow because of invalid graphql input", async () => {
        const [response] = await handler.storeWorkflow({
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
                        teams: [{ id: "team-1" }],
                        notifications: [{ id: "" }]
                    }
                ]
            }
        });
        expect(response).toEqual({
            data: {
                workflows: {
                    storeWorkflow: {
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
        const [response] = await handler.storeWorkflow({
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
                    storeWorkflow: {
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

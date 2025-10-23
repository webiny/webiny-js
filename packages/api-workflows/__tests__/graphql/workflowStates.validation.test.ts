import { describe, expect, it } from "vitest";
import { createGraphQLHandler } from "~tests/__helpers/handler.js";

describe("workflow states graphql validation", () => {
    const handler = createGraphQLHandler();

    it("should fail to validate create input", async () => {
        const [response] = await handler.createWorkflowState({
            app: "",
            targetRevisionId: ""
        });

        expect(response).toMatchObject({
            data: {
                workflows: {
                    createWorkflowState: {
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
                                    },
                                    targetRevisionId: {
                                        code: "too_small",
                                        data: {
                                            path: ["targetRevisionId"]
                                        },
                                        message: "Target revision ID is required."
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

    it("should fail to validate approve state step input", async () => {
        const [response] = await handler.approveWorkflowStateStep({
            id: ""
        });
        expect(response).toMatchObject({
            data: {
                workflows: {
                    approveWorkflowStateStep: {
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

    it("should fail to validate reject state step input", async () => {
        const [response] = await handler.rejectWorkflowStateStep({
            id: "",
            comment: ""
        });
        expect(response).toMatchObject({
            data: {
                workflows: {
                    rejectWorkflowStateStep: {
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

    it("should fail to validate cancel state input", async () => {
        const [response] = await handler.cancelWorkflowState({
            id: ""
        });
        expect(response).toMatchObject({
            data: {
                workflows: {
                    cancelWorkflowState: {
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

    it("should fail to validate get workflow state input", async () => {
        const [response] = await handler.getWorkflowState({
            id: ""
        });
        expect(response).toMatchObject({
            data: {
                workflows: {
                    getWorkflowState: {
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

    it("should fail to validate get target workflow state input", async () => {
        const [response] = await handler.getTargetWorkflowState({
            app: "",
            targetRevisionId: ""
        });
        expect(response).toMatchObject({
            data: {
                workflows: {
                    getTargetWorkflowState: {
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
                                    },
                                    targetRevisionId: {
                                        code: "too_small",
                                        data: {
                                            path: ["targetRevisionId"]
                                        },
                                        message: "Target revision ID is required."
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

    it("should fail to validate list workflow states input", async () => {
        /**
         * We need to cast as any because types are limiting the ability to pass incorrect types for testing purposes.
         */
        const [response] = await handler.listWorkflowStates({
            where: {
                app: "",
                app_in: [""],
                workflowId: "",
                workflowId_in: ["", "false"],
                targetId: "",
                targetId_in: [""],
                targetRevisionId: "",
                targetRevisionId_in: [""],
                state: undefined,
                state_in: [],
                savedBy: "",
                createdBy: "",
                isActive: false
            },
            after: "",
            sort: ["createdOn_DESC", "savedOn_ASC"],
            limit: 100000
        });
        expect(response).toMatchObject({
            data: {
                workflows: {
                    listWorkflowStates: {
                        data: null,
                        error: {
                            code: "VALIDATION_FAILED_INVALID_FIELDS",
                            data: {
                                invalidFields: {
                                    after: {
                                        code: "too_small",
                                        data: {
                                            path: ["after"]
                                        },
                                        message: "After cursor cannot be empty string."
                                    },
                                    limit: {
                                        code: "too_big",
                                        data: {
                                            path: ["limit"]
                                        },
                                        message: "Number must be less than or equal to 10000"
                                    },
                                    sort: {
                                        code: "too_big",
                                        data: {
                                            path: ["sort"]
                                        },
                                        message: "Cannot sort by more than one field."
                                    },
                                    "where.app": {
                                        code: "too_small",
                                        data: {
                                            path: ["where", "app"]
                                        },
                                        message: "App cannot be empty string."
                                    },
                                    "where.app_in.0": {
                                        code: "too_small",
                                        data: {
                                            path: ["where", "app_in", 0]
                                        },
                                        message: "App cannot be empty string."
                                    },
                                    "where.createdBy": {
                                        code: "too_small",
                                        data: {
                                            path: ["where", "createdBy"]
                                        },
                                        message: "Created By cannot be empty string."
                                    },
                                    "where.savedBy": {
                                        code: "too_small",
                                        data: {
                                            path: ["where", "savedBy"]
                                        },
                                        message: "Saved By cannot be empty string."
                                    },
                                    "where.targetId": {
                                        code: "too_small",
                                        data: {
                                            path: ["where", "targetId"]
                                        },
                                        message: "Target ID cannot be empty string."
                                    },
                                    "where.targetId_in.0": {
                                        code: "too_small",
                                        data: {
                                            path: ["where", "targetId_in", 0]
                                        },
                                        message: "Target ID cannot be empty string."
                                    },
                                    "where.targetRevisionId": {
                                        code: "too_small",
                                        data: {
                                            path: ["where", "targetRevisionId"]
                                        },
                                        message: "Target Revision ID cannot be empty string."
                                    },
                                    "where.targetRevisionId_in.0": {
                                        code: "too_small",
                                        data: {
                                            path: ["where", "targetRevisionId_in", 0]
                                        },
                                        message: "Target Revision ID cannot be empty string."
                                    },
                                    "where.workflowId": {
                                        code: "too_small",
                                        data: {
                                            path: ["where", "workflowId"]
                                        },
                                        message: "Workflow ID cannot be empty string."
                                    },
                                    "where.workflowId_in.0": {
                                        code: "too_small",
                                        data: {
                                            path: ["where", "workflowId_in", 0]
                                        },
                                        message: "Workflow ID cannot be empty string."
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

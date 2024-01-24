import { TaskEventValidation } from "~/runner/TaskEventValidation";
import { ITaskEvent } from "~/handler/types";
import WebinyError from "@webiny/error";

describe("task event validation", () => {
    it("should pass the validation", async () => {
        const validation = new TaskEventValidation();

        const event: ITaskEvent = {
            webinyTaskId: "123webinyTaskId",
            webinyTaskDefinitionId: "webinyTaskDefinitionIdMockId",
            tenant: "root",
            locale: "en-US",
            stateMachineId: "123stateMachineId",
            endpoint: "manage",
            executionName: "someExecutionName"
        };
        const result = validation.validate(event);

        expect(result).toEqual({
            ...event
        });
    });

    it("should fail the validation - missing webinyTaskId", async () => {
        const validation = new TaskEventValidation();

        const event: Omit<ITaskEvent, "webinyTaskId"> = {
            tenant: "root",
            locale: "en-US",
            stateMachineId: "123stateMachineId",
            webinyTaskDefinitionId: "webinyTaskDefinitionIdMockId",
            endpoint: "manage",
            executionName: "someExecutionName"
        };

        let result: ITaskEvent | null = null;
        let error: WebinyError | null = null;
        try {
            result = validation.validate(event);
        } catch (ex) {
            error = ex;
        }
        expect(result).toEqual(null);
        expect(error!.message).toEqual("Validation failed.");
        expect(error!.code).toEqual("VALIDATION_FAILED_INVALID_FIELDS");
        expect(error!.data).toEqual({
            invalidFields: {
                webinyTaskId: {
                    code: "invalid_type",
                    message: "Required",
                    data: {
                        path: ["webinyTaskId"]
                    }
                }
            }
        });
    });

    it("should fail the validation - missing webinyTaskDefinitionId", async () => {
        const validation = new TaskEventValidation();

        const event: Omit<ITaskEvent, "webinyTaskDefinitionId"> = {
            tenant: "root",
            locale: "en-US",
            stateMachineId: "123stateMachineId",
            webinyTaskId: "1234",
            endpoint: "manage",
            executionName: "someExecutionName"
        };

        let result: ITaskEvent | null = null;
        let error: WebinyError | null = null;
        try {
            result = validation.validate(event);
        } catch (ex) {
            error = ex;
        }
        expect(result).toEqual(null);
        expect(error!.message).toEqual("Validation failed.");
        expect(error!.code).toEqual("VALIDATION_FAILED_INVALID_FIELDS");
        expect(error!.data).toEqual({
            invalidFields: {
                webinyTaskDefinitionId: {
                    code: "invalid_type",
                    message: "Required",
                    data: {
                        path: ["webinyTaskDefinitionId"]
                    }
                }
            }
        });
    });

    it("should fail the validation - missing tenant", async () => {
        const validation = new TaskEventValidation();

        const event: Omit<ITaskEvent, "tenant"> = {
            webinyTaskId: "123webinyTaskId",
            webinyTaskDefinitionId: "webinyTaskDefinitionIdMockId",
            locale: "en-US",
            stateMachineId: "123stateMachineId",
            endpoint: "manage",
            executionName: "someExecutionName"
        };

        let result: ITaskEvent | null = null;
        let error: WebinyError | null = null;
        try {
            result = validation.validate(event);
        } catch (ex) {
            error = ex;
        }
        expect(result).toEqual(null);
        expect(error!.message).toEqual("Validation failed.");
        expect(error!.code).toEqual("VALIDATION_FAILED_INVALID_FIELDS");
        expect(error!.data).toEqual({
            invalidFields: {
                tenant: {
                    code: "invalid_type",
                    message: "Required",
                    data: {
                        path: ["tenant"]
                    }
                }
            }
        });
    });

    it("should fail the validation - missing locale", async () => {
        const validation = new TaskEventValidation();

        const event: Omit<ITaskEvent, "locale"> = {
            webinyTaskId: "123webinyTaskId",
            webinyTaskDefinitionId: "webinyTaskDefinitionIdMockId",
            tenant: "root",
            stateMachineId: "123stateMachineId",
            endpoint: "manage",
            executionName: "someExecutionName"
        };

        let result: ITaskEvent | null = null;
        let error: WebinyError | null = null;
        try {
            result = validation.validate(event);
        } catch (ex) {
            error = ex;
        }
        expect(result).toEqual(null);
        expect(error!.message).toEqual("Validation failed.");
        expect(error!.code).toEqual("VALIDATION_FAILED_INVALID_FIELDS");
        expect(error!.data).toEqual({
            invalidFields: {
                locale: {
                    code: "invalid_type",
                    message: "Required",
                    data: {
                        path: ["locale"]
                    }
                }
            }
        });
    });

    it("should fail the validation - missing stateMachineId", async () => {
        const validation = new TaskEventValidation();

        const event: Omit<ITaskEvent, "stateMachineId"> = {
            webinyTaskId: "123webinyTaskId",
            webinyTaskDefinitionId: "webinyTaskDefinitionIdMockId",
            tenant: "root",
            locale: "en-US",
            endpoint: "manage",
            executionName: "someExecutionName"
        };

        let result: ITaskEvent | null = null;
        let error: WebinyError | null = null;
        try {
            result = validation.validate(event);
        } catch (ex) {
            error = ex;
        }
        expect(result).toEqual(null);
        expect(error!.message).toEqual("Validation failed.");
        expect(error!.code).toEqual("VALIDATION_FAILED_INVALID_FIELDS");
        expect(error!.data).toEqual({
            invalidFields: {
                stateMachineId: {
                    code: "invalid_type",
                    message: "Required",
                    data: {
                        path: ["stateMachineId"]
                    }
                }
            }
        });
    });

    it("should fail the validation - missing endpoint", async () => {
        const validation = new TaskEventValidation();

        const event: Omit<ITaskEvent, "endpoint"> = {
            webinyTaskId: "123webinyTaskId",
            webinyTaskDefinitionId: "webinyTaskDefinitionIdMockId",
            tenant: "root",
            locale: "en-US",
            stateMachineId: "123stateMachineId",
            executionName: "someExecutionName"
        };

        let result: ITaskEvent | null = null;
        let error: WebinyError | null = null;
        try {
            result = validation.validate(event);
        } catch (ex) {
            error = ex;
        }
        expect(result).toEqual(null);
        expect(error!.message).toEqual("Validation failed.");
        expect(error!.code).toEqual("VALIDATION_FAILED_INVALID_FIELDS");
        expect(error!.data).toEqual({
            invalidFields: {
                endpoint: {
                    code: "invalid_type",
                    message: "Required",
                    data: {
                        path: ["endpoint"]
                    }
                }
            }
        });
    });

    it("should fail the validation - all fields", async () => {
        const validation = new TaskEventValidation();

        const event: Partial<ITaskEvent> = {};

        let result: ITaskEvent | null = null;
        let error: WebinyError | null = null;
        try {
            result = validation.validate(event);
        } catch (ex) {
            error = ex;
        }
        expect(result).toEqual(null);
        expect(error!.message).toEqual("Validation failed.");
        expect(error!.code).toEqual("VALIDATION_FAILED_INVALID_FIELDS");
        expect(error!.data).toEqual({
            invalidFields: {
                webinyTaskId: {
                    code: "invalid_type",
                    message: "Required",
                    data: {
                        path: ["webinyTaskId"]
                    }
                },
                webinyTaskDefinitionId: {
                    code: "invalid_type",
                    message: "Required",
                    data: {
                        path: ["webinyTaskDefinitionId"]
                    }
                },
                tenant: {
                    code: "invalid_type",
                    message: "Required",
                    data: {
                        path: ["tenant"]
                    }
                },
                locale: {
                    code: "invalid_type",
                    message: "Required",
                    data: {
                        path: ["locale"]
                    }
                },
                stateMachineId: {
                    code: "invalid_type",
                    message: "Required",
                    data: {
                        path: ["stateMachineId"]
                    }
                },
                endpoint: {
                    code: "invalid_type",
                    message: "Required",
                    data: {
                        path: ["endpoint"]
                    }
                },
                executionName: {
                    code: "invalid_type",
                    message: "Required",
                    data: {
                        path: ["executionName"]
                    }
                }
            }
        });
    });
});

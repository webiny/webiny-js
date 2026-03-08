import { describe, it, expect } from "vitest";
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
                    message: "Invalid input: expected string, received undefined",
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
                    message: "Invalid input: expected string, received undefined",
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
                    message: "Invalid input: expected string, received undefined",
                    data: {
                        path: ["tenant"]
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
                    message: "Invalid input: expected string, received undefined",
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
                    message: "Invalid input: expected string, received undefined",
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
                    message: "Invalid input: expected string, received undefined",
                    data: {
                        path: ["webinyTaskId"]
                    }
                },
                webinyTaskDefinitionId: {
                    code: "invalid_type",
                    message: "Invalid input: expected string, received undefined",
                    data: {
                        path: ["webinyTaskDefinitionId"]
                    }
                },
                tenant: {
                    code: "invalid_type",
                    message: "Invalid input: expected string, received undefined",
                    data: {
                        path: ["tenant"]
                    }
                },
                stateMachineId: {
                    code: "invalid_type",
                    message: "Invalid input: expected string, received undefined",
                    data: {
                        path: ["stateMachineId"]
                    }
                },
                endpoint: {
                    code: "invalid_type",
                    message: "Invalid input: expected string, received undefined",
                    data: {
                        path: ["endpoint"]
                    }
                },
                executionName: {
                    code: "invalid_type",
                    message: "Invalid input: expected string, received undefined",
                    data: {
                        path: ["executionName"]
                    }
                }
            }
        });
    });
});

import { TaskEventValidation } from "~/runner/TaskEventValidation";
import { ITaskEvent } from "~/handler/types";
import WebinyError from "@webiny/error";

describe("task event validation", () => {
    it("should pass the validation", async () => {
        const validation = new TaskEventValidation();

        const event: ITaskEvent = {
            webinyTaskId: "123webinyTaskId",
            tenant: "root",
            locale: "en-US",
            stateMachineId: "123stateMachineId",
            endpoint: "manage"
        };
        const result = validation.validate(event);

        expect(result).toEqual({
            ...event
        });
    });

    it("should fail the validation - missing webinyTaskId", async () => {
        const validation = new TaskEventValidation();

        const event: Partial<ITaskEvent> = {
            tenant: "root",
            locale: "en-US",
            stateMachineId: "123stateMachineId",
            endpoint: "manage"
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

    it("should fail the validation - missing tenant", async () => {
        const validation = new TaskEventValidation();

        const event: Partial<ITaskEvent> = {
            webinyTaskId: "123webinyTaskId",
            locale: "en-US",
            stateMachineId: "123stateMachineId",
            endpoint: "manage"
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

        const event: Partial<ITaskEvent> = {
            webinyTaskId: "123webinyTaskId",
            tenant: "root",
            stateMachineId: "123stateMachineId",
            endpoint: "manage"
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

        const event: Partial<ITaskEvent> = {
            webinyTaskId: "123webinyTaskId",
            tenant: "root",
            locale: "en-US",
            endpoint: "manage"
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

        const event: Partial<ITaskEvent> = {
            webinyTaskId: "123webinyTaskId",
            tenant: "root",
            locale: "en-US",
            stateMachineId: "123stateMachineId"
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
                }
            }
        });
    });
});

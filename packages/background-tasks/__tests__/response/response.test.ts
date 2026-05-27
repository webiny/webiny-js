import { describe, it, expect, beforeEach } from "vitest";
import {
    Response,
    ResponseAbortedResult,
    ResponseContinueResult,
    ResponseDoneResult,
    ResponseErrorResult
} from "~/api/response";
import { createMockEvent } from "~tests/mocks";
import type { ITaskEvent } from "~/api/handler/types";
import { WebinyError } from "@webiny/error";
import { TaskResultStatus } from "@webiny/api-core/features/task/TaskDefinition/index.js";

describe("response", () => {
    let event: ITaskEvent;

    beforeEach(() => {
        event = createMockEvent();
    });

    it("should output continue response", async () => {
        const response = new Response(event);

        const message = "Some continue message";

        const result = response.continue({
            message,
            input: {
                aInput: true
            },
            wait: 30,
            tenant: event.tenant,
            webinyTaskId: event.webinyTaskId
        });

        expect(result).toBeInstanceOf(ResponseContinueResult);

        expect(result).toEqual({
            message,
            input: {
                aInput: true
            },
            status: TaskResultStatus.CONTINUE,
            webinyTaskId: event.webinyTaskId,
            webinyTaskDefinitionId: event.webinyTaskDefinitionId,
            tenant: event.tenant,
            wait: 30,
            delay: -1
        });
    });

    it("should output done response", async () => {
        const response = new Response(event);

        const message = "Some done message";

        const result = response.done({
            message,
            output: {
                aDoneOutput: true
            },
            tenant: event.tenant,
            webinyTaskId: event.webinyTaskId
        });

        expect(result).toBeInstanceOf(ResponseDoneResult);

        expect(result).toEqual({
            message,
            output: {
                aDoneOutput: true
            },
            status: TaskResultStatus.DONE,
            webinyTaskId: event.webinyTaskId,
            webinyTaskDefinitionId: event.webinyTaskDefinitionId,
            tenant: event.tenant
        });
    });

    it("should output error response", async () => {
        const response = new Response(event);

        const message = "Some error message";

        const result = response.error({
            error: new WebinyError({
                message,
                code: "SOME_ERROR_CODE",
                data: {
                    someData: true
                }
            }),
            webinyTaskId: event.webinyTaskId,
            tenant: event.tenant
        });

        expect(result).toBeInstanceOf(ResponseErrorResult);

        expect(result).toEqual({
            error: {
                message,
                code: "SOME_ERROR_CODE",
                data: {
                    someData: true
                }
            },
            status: TaskResultStatus.ERROR,
            webinyTaskId: event.webinyTaskId,
            webinyTaskDefinitionId: event.webinyTaskDefinitionId,
            tenant: event.tenant
        });
    });

    it("should output aborted response", async () => {
        const response = new Response(event);

        const result = response.aborted();

        expect(result).toBeInstanceOf(ResponseAbortedResult);

        expect(result).toEqual({
            status: TaskResultStatus.ABORTED,
            webinyTaskId: event.webinyTaskId,
            webinyTaskDefinitionId: event.webinyTaskDefinitionId,
            tenant: event.tenant
        });
    });

    it("should create done response via from method", async () => {
        const response = new Response(event);

        const message = "Some done message";

        const done = response.from({
            message,
            output: {
                aDoneOutput: true
            },
            tenant: event.tenant,
            webinyTaskId: event.webinyTaskId,
            status: TaskResultStatus.DONE,
            webinyTaskDefinitionId: event.webinyTaskDefinitionId
        });

        expect(done).toBeInstanceOf(ResponseDoneResult);
        expect(done).toEqual({
            message,
            output: {
                aDoneOutput: true
            },
            status: TaskResultStatus.DONE,
            webinyTaskId: event.webinyTaskId,
            webinyTaskDefinitionId: event.webinyTaskDefinitionId,
            tenant: event.tenant
        });
    });

    it("should create continue response via from method", async () => {
        const response = new Response(event);

        const message = "Some continue message";

        const done = response.from({
            message,
            input: {
                aInput: true
            },
            wait: 30,
            tenant: event.tenant,
            webinyTaskId: event.webinyTaskId,
            status: TaskResultStatus.CONTINUE,
            webinyTaskDefinitionId: event.webinyTaskDefinitionId,
            delay: -1
        });

        expect(done).toBeInstanceOf(ResponseContinueResult);
        expect(done).toEqual({
            message,
            input: {
                aInput: true
            },
            status: TaskResultStatus.CONTINUE,
            webinyTaskId: event.webinyTaskId,
            webinyTaskDefinitionId: event.webinyTaskDefinitionId,
            tenant: event.tenant,
            wait: 30,
            delay: -1
        });
    });

    it("should create error response via from method", async () => {
        const response = new Response(event);

        const message = "Some error message";

        const done = response.from({
            error: new WebinyError({
                message,
                code: "SOME_ERROR_CODE",
                data: {
                    someData: true
                }
            }),
            webinyTaskId: event.webinyTaskId,
            tenant: event.tenant,
            status: TaskResultStatus.ERROR,
            webinyTaskDefinitionId: event.webinyTaskDefinitionId
        });

        expect(done).toBeInstanceOf(ResponseErrorResult);
        expect(done).toEqual({
            error: {
                message,
                code: "SOME_ERROR_CODE",
                data: {
                    someData: true
                }
            },
            status: TaskResultStatus.ERROR,
            webinyTaskId: event.webinyTaskId,
            webinyTaskDefinitionId: event.webinyTaskDefinitionId,
            tenant: event.tenant
        });
    });

    it("should truncate output because it is too large", async () => {
        const response = new Response(event);

        const message = "Some done message";
        const result = response.done({
            message,
            output: {
                aDoneOutput: true,
                aLargeOutput: new Array(8000).fill("123456789011121314151617181920").join("")
            },
            tenant: event.tenant,
            webinyTaskId: event.webinyTaskId
        });

        expect(result).toBeInstanceOf(ResponseDoneResult);
        expect(result).toEqual({
            message,
            output: {
                message: `Output size exceeds the maximum allowed size.`,
                size: 240038,
                max: 232 * 1024
            },
            status: TaskResultStatus.DONE,
            webinyTaskId: event.webinyTaskId,
            webinyTaskDefinitionId: event.webinyTaskDefinitionId,
            tenant: event.tenant
        });
    });
});

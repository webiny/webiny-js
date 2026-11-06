import { describe, expect, it, vi } from "vitest";
import { Container } from "@webiny/di";
import { HttpRouteHandler } from "@webiny/event-handler-core";
import type { IHttpRequest, IHttpResponseBuilder } from "@webiny/event-handler-core";
import { isJsonContentType, parseChatBody } from "~/api/features/AdminAssistant/parseChatBody.js";
import { AdminAssistantStreamRoute } from "~/api/features/AdminAssistant/AdminAssistantStreamRoute.js";
import { AdminAssistantUseCase } from "~/api/features/AdminAssistant/abstractions.js";

describe("parseChatBody", () => {
    it("accepts a prompt from a parsed body", () => {
        expect(parseChatBody({ prompt: "Hello" })).toEqual({
            messages: [{ role: "user", content: "Hello" }],
            decisions: []
        });
    });

    it("accepts a prompt from a JSON string", () => {
        expect(parseChatBody(JSON.stringify({ prompt: "Hello" }))?.messages).toEqual([
            { role: "user", content: "Hello" }
        ]);
    });

    it("refuses invalid JSON", () => {
        expect(parseChatBody("{not json")).toBeNull();
    });

    it("refuses a JSON string with a __proto__ key", () => {
        expect(parseChatBody('{"prompt":"Hello","__proto__":{"isAdmin":true}}')).toBeNull();
        expect(({} as Record<string, unknown>)["isAdmin"]).toBeUndefined();
    });

    it("refuses a JSON string with a constructor.prototype key", () => {
        expect(
            parseChatBody('{"prompt":"Hello","constructor":{"prototype":{"isAdmin":true}}}')
        ).toBeNull();
    });
});

describe("isJsonContentType", () => {
    it.each([["application/json"], ["application/json; charset=utf-8"], ["Application/JSON"]])(
        "accepts %j",
        value => {
            expect(isJsonContentType({ "content-type": value })).toBe(true);
        }
    );

    it("finds the header regardless of its case", () => {
        expect(isJsonContentType({ "Content-Type": "application/json" })).toBe(true);
    });

    it.each([["text/plain"], ["application/x-www-form-urlencoded"], ["multipart/form-data"]])(
        "refuses %j",
        value => {
            expect(isJsonContentType({ "content-type": value })).toBe(false);
        }
    );

    it("refuses a request without a content type", () => {
        expect(isJsonContentType({})).toBe(false);
    });
});

interface RecordedResponse {
    statusCode: number | undefined;
    body: unknown;
    streamed: boolean;
}

const createResponseBuilder = (recorded: RecordedResponse): IHttpResponseBuilder => {
    const builder = {
        status: (code: number) => {
            recorded.statusCode = code;
            return builder;
        },
        json: (body: unknown) => {
            recorded.body = body;
            return builder;
        },
        sse: () => {
            recorded.streamed = true;
            return builder;
        }
    };
    return builder as unknown as IHttpResponseBuilder;
};

const handle = async (headers: Record<string, string>, body: unknown) => {
    const container = new Container();
    const stream = vi.fn(async function* () {
        // Nothing to stream; the test only checks whether the use case was reached.
    });
    container.registerInstance(AdminAssistantUseCase, {
        stream
    } as unknown as AdminAssistantUseCase.Interface);
    container.register(AdminAssistantStreamRoute);

    const recorded: RecordedResponse = { statusCode: undefined, body: undefined, streamed: false };
    const request = {
        method: "POST",
        path: "/stream/ai/admin-assistant",
        headers,
        query: {},
        pathParameters: {},
        body
    } as IHttpRequest;

    await container
        .resolve(HttpRouteHandler)
        .handle(request as HttpRouteHandler.Request, createResponseBuilder(recorded));

    return { recorded, stream };
};

describe("AdminAssistantStreamRoute", () => {
    it("answers 415 for a non-JSON content type without calling the assistant", async () => {
        const { recorded, stream } = await handle(
            { "content-type": "text/plain" },
            JSON.stringify({ prompt: "Hello" })
        );

        expect(recorded.statusCode).toBe(415);
        expect(stream).not.toHaveBeenCalled();
    });

    it("answers 400 for a body it can't use", async () => {
        const { recorded, stream } = await handle({ "content-type": "application/json" }, "{bad");

        expect(recorded.statusCode).toBe(400);
        expect(stream).not.toHaveBeenCalled();
    });

    it("streams the answer for a JSON request", async () => {
        const { recorded, stream } = await handle(
            { "content-type": "application/json" },
            { prompt: "Hello" }
        );

        expect(recorded.statusCode).toBeUndefined();
        expect(recorded.streamed).toBe(true);
        expect(stream).toHaveBeenCalledTimes(1);
    });
});

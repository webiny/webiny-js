import { describe, it, expect, beforeEach, vi } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { HttpRoute, HttpStreamBody, RequestContainer } from "@webiny/event-handler-core";
import type { IHttpRequest, IHttpResponse } from "@webiny/event-handler-core";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import { WcpContext } from "@webiny/api-core/features/wcp/WcpContext/index.js";
import { AiImageEnrichmentStreamRoute } from "~/api/features/AiImageEnrichment/AiImageEnrichmentStreamRoute.js";
import {
    ApplyImageEnrichmentUseCase,
    PrepareImageEnrichmentUseCase
} from "~/api/features/AiImageEnrichment/abstractions.js";
import type { IPreparedImageEnrichment } from "~/api/features/AiImageEnrichment/abstractions.js";
import {
    EnrichmentFileNotFoundError,
    EnrichmentNoProviderError,
    EnrichmentNotAnImageError,
    EnrichmentPersistError
} from "~/api/features/AiImageEnrichment/errors.js";

const prepared: IPreparedImageEnrichment = {
    fileId: "file-1",
    existingTags: ["existing"],
    imageBase64: "aGVsbG8=",
    imageMediaType: "image/png",
    model: "anthropic/claude-sonnet-4-5",
    connection: { sdkName: "anthropic", apiKey: "key" }
};

function request(fileId = "file-1"): IHttpRequest {
    return {
        method: "POST",
        path: `/stream/fm/files/${fileId}/enrich`,
        headers: {},
        query: {},
        pathParameters: { fileId },
        body: undefined
    };
}

async function* partials(values: any[]) {
    for (const value of values) {
        yield value;
    }
}

/** Drain a streaming response into the parsed SSE event objects it emitted. */
async function collectEvents(response: IHttpResponse) {
    expect(HttpStreamBody.is(response.body)).toBe(true);
    const text = new TextDecoder().decode(await (response.body as HttpStreamBody).collect());

    return text
        .split("\n\n")
        .filter(Boolean)
        .map(record => JSON.parse(record.replace(/^data: /, "")));
}

describe("AiImageEnrichmentStreamRoute", () => {
    let container: Container;
    let route: HttpRoute.Interface;
    let prepare: { execute: ReturnType<typeof vi.fn> };
    let apply: { execute: ReturnType<typeof vi.fn> };
    let ai: { streamText: ReturnType<typeof vi.fn> };
    let canUse: boolean;

    beforeEach(() => {
        canUse = true;
        prepare = { execute: vi.fn().mockResolvedValue(Result.ok(prepared)) };
        apply = {
            execute: vi.fn().mockImplementation(async (params: any) =>
                Result.ok({
                    fileId: params.fileId,
                    tags: [...new Set([...params.existingTags, ...params.tags])],
                    description: params.description
                })
            )
        };
        ai = {
            streamText: vi.fn().mockResolvedValue({
                partialOutputStream: partials([
                    { tags: ["cat"] },
                    { tags: ["cat", "sofa"], description: "A cat" },
                    { tags: ["cat", "sofa"], description: "A cat on a sofa." }
                ])
            })
        };

        container = new Container();
        container.registerInstance(RequestContainer, container);
        container.registerInstance(WcpContext, {
            canUseAiImageEnrichment: () => canUse
        } as any);
        container.registerInstance(PrepareImageEnrichmentUseCase, prepare as any);
        container.registerInstance(ApplyImageEnrichmentUseCase, apply as any);
        container.registerInstance(Ai, ai as any);
        container.register(AiImageEnrichmentStreamRoute);

        route = container.resolveAll(HttpRoute)[0];
    });

    it("should be a POST route with a file-scoped path", () => {
        expect(route.method).toBe("POST");
        expect(route.path).toBe("/stream/fm/files/:fileId/enrich");
    });

    it("should respond with SSE headers that defeat proxy buffering", async () => {
        const response = await route.handle(request());

        expect(response.statusCode).toBe(200);
        expect(response.headers?.["content-type"]).toBe("text/event-stream");
        // `no-transform` is what stops CloudFront compressing (and thus buffering) the body.
        expect(response.headers?.["cache-control"]).toContain("no-transform");
        expect(response.headers?.["x-accel-buffering"]).toBe("no");
    });

    it("should stream start, each partial, and done", async () => {
        const events = await collectEvents(await route.handle(request()));

        expect(events[0]).toEqual({
            type: "start",
            fileId: "file-1",
            model: "anthropic/claude-sonnet-4-5"
        });
        expect(events.slice(1, 4)).toEqual([
            { type: "partial", tags: ["cat"], description: "" },
            { type: "partial", tags: ["cat", "sofa"], description: "A cat" },
            { type: "partial", tags: ["cat", "sofa"], description: "A cat on a sofa." }
        ]);
        expect(events[4]).toEqual({
            type: "done",
            fileId: "file-1",
            tags: ["existing", "cat", "sofa"],
            description: "A cat on a sofa."
        });
    });

    it("should persist the final output merged with the file's existing tags", async () => {
        await collectEvents(await route.handle(request()));

        expect(apply.execute).toHaveBeenCalledWith({
            fileId: "file-1",
            existingTags: ["existing"],
            tags: ["cat", "sofa"],
            description: "A cat on a sofa."
        });
    });

    it("should tolerate holes in a partial tag array", async () => {
        ai.streamText.mockResolvedValue({
            partialOutputStream: partials([{ tags: ["cat", undefined] }, { tags: ["cat", "sofa"] }])
        });

        const events = await collectEvents(await route.handle(request()));

        expect(events[1]).toEqual({ type: "partial", tags: ["cat"], description: "" });
    });

    it("should not start the AI call until preparation succeeded", async () => {
        prepare.execute.mockResolvedValue(Result.fail(new EnrichmentFileNotFoundError("nope")));

        await route.handle(request("nope"));

        expect(ai.streamText).not.toHaveBeenCalled();
    });

    describe("failures detectable before the stream opens", () => {
        it("should answer 404 for a missing file", async () => {
            prepare.execute.mockResolvedValue(Result.fail(new EnrichmentFileNotFoundError("nope")));

            const response = await route.handle(request("nope"));

            expect(response.statusCode).toBe(404);
            expect(HttpStreamBody.is(response.body)).toBe(false);
            expect(response.body.code).toBe("ENRICHMENT_FILE_NOT_FOUND");
        });

        it("should answer 400 for a non-image", async () => {
            prepare.execute.mockResolvedValue(
                Result.fail(new EnrichmentNotAnImageError("application/pdf"))
            );

            const response = await route.handle(request());

            expect(response.statusCode).toBe(400);
            expect(response.body.code).toBe("ENRICHMENT_NOT_AN_IMAGE");
        });

        it("should answer 500 when no AI provider is configured", async () => {
            prepare.execute.mockResolvedValue(Result.fail(new EnrichmentNoProviderError()));

            const response = await route.handle(request());

            expect(response.statusCode).toBe(500);
            expect(response.body.code).toBe("ENRICHMENT_NO_AI_PROVIDER");
        });

        it("should answer 403 when the license does not allow enrichment", async () => {
            canUse = false;

            const response = await route.handle(request());

            expect(response.statusCode).toBe(403);
            expect(prepare.execute).not.toHaveBeenCalled();
        });

        it("should answer 400 when no file ID was matched", async () => {
            const response = await route.handle({ ...request(), pathParameters: {} });

            expect(response.statusCode).toBe(400);
        });
    });

    describe("failures after the stream opened", () => {
        it("should emit an error event when the AI call throws", async () => {
            ai.streamText.mockRejectedValue(new Error("rate limited"));

            const events = await collectEvents(await route.handle(request()));

            expect(events[0].type).toBe("start");
            expect(events[1]).toEqual({
                type: "error",
                message: "AI enrichment failed: rate limited"
            });
            expect(apply.execute).not.toHaveBeenCalled();
        });

        it("should emit an error event when persisting fails", async () => {
            apply.execute.mockResolvedValue(Result.fail(new EnrichmentPersistError("no access")));

            const events = await collectEvents(await route.handle(request()));

            expect(events[events.length - 1]).toEqual({
                type: "error",
                message: "Failed to update file: no access"
            });
        });

        it("should emit no done event after an error", async () => {
            ai.streamText.mockRejectedValue(new Error("boom"));

            const events = await collectEvents(await route.handle(request()));

            expect(events.some(e => e.type === "done")).toBe(false);
        });
    });
});

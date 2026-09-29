import { describe, it, expect, vi } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import { WebsocketsSendToIdentityUseCase } from "@webiny/api-websockets/features/SendToIdentity/abstractions.js";
import {
    AiImageEnrichmentTask,
    FILE_ENRICHMENT_FAILED_WEBSOCKET_ACTION
} from "~/api/features/AiImageEnrichment/AiImageEnrichmentTask.js";
import { ApplyImageEnrichmentUseCase } from "~/api/features/AiImageEnrichment/abstractions.js";
import { PrepareImageEnrichmentUseCase } from "~/api/features/AiImageEnrichment/abstractions.js";
import { EnrichmentCapabilityDisabledError } from "~/api/features/AiImageEnrichment/errors.js";
import { EnrichmentNoProviderError } from "~/api/features/AiImageEnrichment/errors.js";
import { EnrichmentNotAnImageError } from "~/api/features/AiImageEnrichment/errors.js";

/*
 * Records which ending the task chose. That is the whole behaviour under test: `done` finishes the
 * task quietly, `error` marks it failed and logs at ERROR, once per upload.
 */
const controller = () => {
    const calls: { kind: "done" | "error" | "aborted"; message?: string }[] = [];

    return {
        calls,
        runtime: { isAborted: () => false },
        response: {
            done: (message?: string) => {
                calls.push({ kind: "done", message });
                return { kind: "done" };
            },
            error: (error: { message: string }) => {
                calls.push({ kind: "error", message: error.message });
                return { kind: "error" };
            },
            aborted: () => {
                calls.push({ kind: "aborted" });
                return { kind: "aborted" };
            }
        }
    };
};

const prepared = {
    fileId: "file-1",
    imageBase64: "aGVsbG8=",
    imageMediaType: "image/png",
    model: "anthropic/claude-sonnet-4-5",
    prompt: "Describe this image.",
    connection: { sdkName: "anthropic", apiKey: "key" }
};

interface IRunOptions {
    prepareFailure?: Error;
    aiFailure?: Error;
    sendFailure?: Error;
}

const run = async (options: IRunOptions) => {
    const container = new Container();
    container.registerInstance(PrepareImageEnrichmentUseCase, {
        execute: vi
            .fn()
            .mockResolvedValue(
                options.prepareFailure ? Result.fail(options.prepareFailure) : Result.ok(prepared)
            )
    } as any);
    container.registerInstance(ApplyImageEnrichmentUseCase, { execute: vi.fn() } as any);
    container.registerInstance(Ai, {
        generateText: vi.fn().mockRejectedValue(options.aiFailure ?? new Error("unexpected"))
    } as any);
    container.registerInstance(IdentityContext, {
        getIdentity: () => ({ id: "uploader-1" })
    } as any);

    const send = vi.fn();
    if (options.sendFailure) {
        send.mockRejectedValue(options.sendFailure);
    }
    container.registerInstance(WebsocketsSendToIdentityUseCase, { execute: send } as any);

    const definition = container.resolveImplementation(AiImageEnrichmentTask);
    const handler = container.resolveImplementation(definition.handler);

    const ctrl = controller();
    await handler.run({ input: { fileId: "file-1" }, controller: ctrl } as any);

    return { calls: ctrl.calls, sent: send.mock.calls };
};

const runWith = async (prepareFailure: Error) => (await run({ prepareFailure })).calls;

describe("AiImageEnrichmentTask", () => {
    it("finishes quietly when image enrichment is switched off", async () => {
        const calls = await runWith(
            new EnrichmentCapabilityDisabledError(
                '"Image enrichment" is switched off. Turn it back on under Settings → AI Power-Ups → Capabilities.'
            )
        );

        expect(calls).toEqual([{ kind: "done", message: expect.stringContaining("switched off") }]);
    });

    it("still finishes quietly for a file that is not an image", async () => {
        const calls = await runWith(new EnrichmentNotAnImageError("application/pdf"));

        expect(calls.map(call => call.kind)).toEqual(["done"]);
    });

    /*
     * The other half of the distinction, and the half #5720 asked for: a missing model is a
     * misconfiguration someone needs to hear about, so it must not be swept into the quiet path.
     */
    it("reports a real misconfiguration as a failure", async () => {
        const calls = await runWith(
            new EnrichmentNoProviderError(
                'No model is configured for the "vision" role. Pick one under Settings → AI Power-Ups → Model roles.'
            )
        );

        expect(calls).toEqual([{ kind: "error", message: expect.stringContaining("vision") }]);
    });
});

/*
 * A failed task only reaches the API log, so without a message the uploader could not tell a
 * missing Vision model or an overloaded provider from enrichment never having run.
 */
describe("AiImageEnrichmentTask failure notifications", () => {
    const failedMessage = (message: string) => [
        { id: "uploader-1" },
        {
            action: FILE_ENRICHMENT_FAILED_WEBSOCKET_ACTION,
            data: { id: "file-1", message: expect.stringContaining(message) }
        }
    ];

    it("tells the uploader about a misconfiguration", async () => {
        const { sent } = await run({
            prepareFailure: new EnrichmentNoProviderError('No model is configured for "vision".')
        });

        expect(sent).toEqual([failedMessage("vision")]);
    });

    it("tells the uploader when the AI call fails", async () => {
        const { calls, sent } = await run({ aiFailure: new Error("Overloaded") });

        expect(calls.map(call => call.kind)).toEqual(["error"]);
        expect(sent).toEqual([failedMessage("AI enrichment failed: Overloaded")]);
    });

    it("says nothing for the quiet endings", async () => {
        const off = await run({ prepareFailure: new EnrichmentCapabilityDisabledError("off") });
        const pdf = await run({ prepareFailure: new EnrichmentNotAnImageError("application/pdf") });

        expect([...off.sent, ...pdf.sent]).toEqual([]);
    });

    it("still fails with the real error when the notification cannot be sent", async () => {
        const { calls } = await run({
            aiFailure: new Error("Overloaded"),
            sendFailure: new Error("no sockets")
        });

        expect(calls).toEqual([{ kind: "error", message: "AI enrichment failed: Overloaded" }]);
    });
});

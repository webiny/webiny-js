import { describe, it, expect, vi } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import { AiImageEnrichmentTask } from "~/api/features/AiImageEnrichment/AiImageEnrichmentTask.js";
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

const runWith = async (prepareFailure: Error) => {
    const container = new Container();
    container.registerInstance(PrepareImageEnrichmentUseCase, {
        execute: vi.fn().mockResolvedValue(Result.fail(prepareFailure))
    } as any);
    container.registerInstance(ApplyImageEnrichmentUseCase, { execute: vi.fn() } as any);
    container.registerInstance(Ai, { generateText: vi.fn() } as any);

    const definition = container.resolveImplementation(AiImageEnrichmentTask);
    const handler = container.resolveImplementation(definition.handler);

    const ctrl = controller();
    await handler.run({ input: { fileId: "file-1" }, controller: ctrl } as any);

    return ctrl.calls;
};

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

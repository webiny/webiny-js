import { describe, it, expect, vi } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { TaskHandler } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { GetFileUseCase } from "@webiny/api-file-manager/features/file/GetFile/index.js";
import { GetFileContentsByIdUseCase } from "@webiny/api-file-manager/features/file/GetFileContentsById/abstractions.js";
import { ResolveAiCapabilityUseCase } from "~/api/features/Capabilities/abstractions.js";
import { AiCapabilityUnavailableError } from "~/api/features/Capabilities/errors.js";
import {
    ApplyImageEnrichmentUseCase,
    PrepareImageEnrichmentUseCase
} from "~/api/features/AiImageEnrichment/abstractions.js";
import { PrepareImageEnrichmentUseCase as PrepareImplementation } from "~/api/features/AiImageEnrichment/PrepareImageEnrichmentUseCase.js";
import { AiImageEnrichmentTaskHandler } from "~/api/features/AiImageEnrichment/AiImageEnrichmentTask.js";
import {
    EnrichmentNoProviderError,
    EnrichmentResolveError
} from "~/api/features/AiImageEnrichment/errors.js";

/**
 * Image enrichment runs on every upload, so the difference between "a setting stops this" and
 * "something broke" decides whether a project with enrichment switched off, or with no Vision
 * model, logs one ERROR per file. These pin both halves of that: `Prepare` picks the error type
 * from the resolver's, and the task finishes on one and fails on the other.
 */

function prepareWith(resolved: Result<any, Error>) {
    const container = new Container();

    container.registerInstance(GetFileUseCase, {
        execute: async () => Result.ok({ id: "file-1", type: "image/png" })
    } as any);
    container.registerInstance(GetFileContentsByIdUseCase, {
        execute: async () => Result.ok({ buffer: Buffer.from("x"), contentType: "image/png" })
    } as any);
    container.registerInstance(ResolveAiCapabilityUseCase, {
        execute: async () => resolved
    } as any);
    container.register(PrepareImplementation);

    return container.resolve(PrepareImageEnrichmentUseCase);
}

function taskWith(prepareError: Error) {
    const container = new Container();
    const warn = vi.fn();

    container.registerInstance(PrepareImageEnrichmentUseCase, {
        execute: async () => Result.fail(prepareError)
    } as any);
    container.registerInstance(ApplyImageEnrichmentUseCase, { execute: vi.fn() } as any);
    container.registerInstance(Ai, { generateText: vi.fn() } as any);
    container.registerInstance(Logger, {
        warn,
        info: vi.fn(),
        error: vi.fn(),
        debug: vi.fn()
    } as any);
    container.register(AiImageEnrichmentTaskHandler);

    const controller = {
        runtime: { isAborted: () => false },
        response: {
            done: vi.fn((message: string) => ({ status: "done", message })),
            error: vi.fn((error: { message: string }) => ({ status: "error", ...error })),
            aborted: vi.fn()
        }
    };

    const run = () =>
        container.resolve(TaskHandler).run({ input: { fileId: "file-1" }, controller } as any);

    return { run, controller, warn };
}

describe("PrepareImageEnrichmentUseCase", () => {
    it("turns a setting that stops enrichment into EnrichmentNoProviderError", async () => {
        const result = await prepareWith(
            Result.fail(new AiCapabilityUnavailableError('"Image enrichment" is switched off.'))
        ).execute("file-1");

        expect(result.isFail()).toBe(true);
        expect(result.error).toBeInstanceOf(EnrichmentNoProviderError);
        expect(result.error.message).toContain("switched off");
    });

    it("turns any other resolve failure into EnrichmentResolveError", async () => {
        const result = await prepareWith(
            Result.fail(new Error('Unknown AI capability "fm.imageEnrichment".'))
        ).execute("file-1");

        expect(result.isFail()).toBe(true);
        expect(result.error).toBeInstanceOf(EnrichmentResolveError);
    });
});

describe("AiImageEnrichmentTask", () => {
    it("finishes, with a warning, when a setting stops enrichment", async () => {
        const { run, controller, warn } = taskWith(
            new EnrichmentNoProviderError('No model is configured for the "vision" role.')
        );

        await run();

        expect(controller.response.done).toHaveBeenCalledOnce();
        expect(controller.response.error).not.toHaveBeenCalled();
        expect(warn).toHaveBeenCalledOnce();
    });

    it("fails when resolution breaks for a reason that is not a setting", async () => {
        const { run, controller, warn } = taskWith(
            new EnrichmentResolveError('Unknown AI capability "fm.imageEnrichment".')
        );

        await run();

        expect(controller.response.error).toHaveBeenCalledOnce();
        expect(controller.response.done).not.toHaveBeenCalled();
        expect(warn).not.toHaveBeenCalled();
    });
});

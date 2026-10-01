import { describe, it, expect, vi } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import { GetFileUseCase } from "@webiny/api-file-manager/features/file/GetFile/index.js";
import { UpdateFileUseCase } from "@webiny/api-file-manager/features/file/UpdateFile/index.js";
import { GetSettingsUseCase as FmGetSettingsUseCase } from "@webiny/api-file-manager/features/settings/GetSettings/abstractions.js";
import { WebsocketsSendToIdentityUseCase } from "@webiny/api-websockets/features/SendToIdentity/abstractions.js";
import { ResolveAiCapabilityUseCase } from "~/api/features/Capabilities/abstractions.js";
import { AiCapabilityDisabledError } from "~/api/features/Capabilities/AiCapabilityDisabledError.js";
import { AiImageEnrichmentTask } from "~/api/features/AiImageEnrichment/AiImageEnrichmentTask.js";

/*
 * Image enrichment runs on every upload, so how a failed resolve ends decides what the log looks
 * like for every project that has not set it up. Switched off is a choice and finishes quietly;
 * anything else is a misconfiguration and fails the task, which logs once per upload.
 */
const controller = () => {
    const calls: { kind: "done" | "error"; message?: string }[] = [];

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
            aborted: () => ({ kind: "aborted" })
        }
    };
};

const runWith = async (resolveFailure: Error) => {
    const container = new Container();

    container.registerInstance(GetFileUseCase, {
        execute: vi.fn().mockResolvedValue(Result.ok({ id: "file-1", type: "image/png", key: "k" }))
    } as any);
    container.registerInstance(FmGetSettingsUseCase, {
        execute: vi.fn().mockResolvedValue(Result.ok({ srcPrefix: "" }))
    } as any);
    container.registerInstance(UpdateFileUseCase, { execute: vi.fn() } as any);
    container.registerInstance(Ai, { generateText: vi.fn() } as any);
    container.registerInstance(ResolveAiCapabilityUseCase, {
        execute: vi.fn().mockResolvedValue(Result.fail(resolveFailure))
    } as any);
    container.registerInstance(IdentityContext, {} as any);
    container.registerInstance(WebsocketsSendToIdentityUseCase, { execute: vi.fn() } as any);
    container.register(AiImageEnrichmentTask);

    const ctrl = controller();
    await container
        .resolve(TaskDefinition)
        .run({ input: { fileId: "file-1" }, controller: ctrl } as any);

    return ctrl.calls;
};

describe("AiImageEnrichmentTask", () => {
    it("finishes quietly when image enrichment is switched off", async () => {
        const calls = await runWith(
            new AiCapabilityDisabledError(
                "fmImageEnrichment",
                "Image enrichment",
                "Settings → AI Power-Ups"
            )
        );

        expect(calls).toEqual([{ kind: "done", message: expect.stringContaining("switched off") }]);
    });

    it("reports a real misconfiguration as a failure", async () => {
        const calls = await runWith(
            new Error(
                'No model is configured for the "vision" role, and image work does not fall back to Standard.'
            )
        );

        expect(calls).toEqual([{ kind: "error", message: expect.stringContaining("vision") }]);
    });
});

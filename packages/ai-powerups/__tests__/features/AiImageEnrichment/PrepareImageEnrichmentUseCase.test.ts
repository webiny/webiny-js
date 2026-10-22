import { describe, it, expect, vi } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { GetFileUseCase } from "@webiny/api-file-manager/features/file/GetFile/index.js";
import { GetFileContentsByIdUseCase } from "@webiny/api-file-manager/features/file/GetFileContentsById/abstractions.js";
import { ResolveAiCapabilityUseCase } from "~/api/features/Capabilities/index.js";
import { AiCapabilityDisabledError } from "~/api/features/Capabilities/AiCapabilityDisabledError.js";
import { PrepareImageEnrichmentUseCase } from "~/api/features/AiImageEnrichment/abstractions.js";
import { PrepareImageEnrichmentUseCase as PrepareImplementation } from "~/api/features/AiImageEnrichment/PrepareImageEnrichmentUseCase.js";
import { EnrichmentCapabilityDisabledError } from "~/api/features/AiImageEnrichment/errors.js";

const setup = (resolution: Result<any, Error>) => {
    const getFileContents = {
        execute: vi
            .fn()
            .mockResolvedValue(
                Result.ok({ buffer: Buffer.from("hello"), contentType: "image/png" })
            )
    };

    const container = new Container();
    container.registerInstance(GetFileUseCase, {
        execute: vi.fn().mockResolvedValue(Result.ok({ id: "file-1", type: "image/png" }))
    } as any);
    container.registerInstance(GetFileContentsByIdUseCase, getFileContents as any);
    container.registerInstance(ResolveAiCapabilityUseCase, {
        execute: vi.fn().mockResolvedValue(resolution)
    } as any);
    container.register(PrepareImplementation);

    return { prepare: container.resolve(PrepareImageEnrichmentUseCase), getFileContents };
};

describe("PrepareImageEnrichmentUseCase", () => {
    /*
     * Switched off is a quiet, normal outcome, so the order matters: checking the capability after
     * the download would pull every uploaded image from storage and discard it.
     */
    it("does not download the image when enrichment is switched off", async () => {
        const disabled = new AiCapabilityDisabledError(
            "fmImageEnrichment",
            "Image enrichment",
            "Settings → AI Power-Ups"
        );
        const { prepare, getFileContents } = setup(Result.fail(disabled));

        const result = await prepare.execute("file-1");

        expect(result.error).toBeInstanceOf(EnrichmentCapabilityDisabledError);
        expect(getFileContents.execute).not.toHaveBeenCalled();
    });

    /* The other half, so the test above cannot pass just because nothing ever downloads. */
    it("downloads the image when enrichment is on", async () => {
        const { prepare, getFileContents } = setup(
            Result.ok({
                capabilityId: "fmImageEnrichment",
                model: "anthropic/claude-sonnet-4-5",
                connection: { sdkName: "anthropic", apiKey: "sk-test" },
                roleId: "vision",
                fellBackToStandard: false,
                guidance: "Describe the image.",
                additionalInstructions: ""
            })
        );

        const result = await prepare.execute("file-1");

        expect(result.isOk()).toBe(true);
        expect(getFileContents.execute).toHaveBeenCalledWith("file-1");
    });
});

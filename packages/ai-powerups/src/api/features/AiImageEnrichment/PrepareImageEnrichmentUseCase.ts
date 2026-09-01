import { Result } from "@webiny/feature/api";
import { Encryption } from "@webiny/api-core/features/encryption/index.js";
import { GetFileUseCase } from "@webiny/api-file-manager/features/file/GetFile/index.js";
import { GetFileContentsByIdUseCase } from "@webiny/api-file-manager/features/file/GetFileContentsById/abstractions.js";
import {
    PrepareImageEnrichmentUseCase as UseCaseAbstraction,
    type IPreparedImageEnrichment
} from "./abstractions.js";
import { GetSettingsUseCase } from "~/api/features/GetSettings/index.js";
import {
    EnrichmentFileContentsError,
    EnrichmentFileNotFoundError,
    EnrichmentNoProviderError,
    EnrichmentNotAnImageError
} from "./errors.js";
import type { ImageEnrichmentError } from "./errors.js";

class PrepareImageEnrichmentUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private getFile: GetFileUseCase.Interface,
        private getFileContents: GetFileContentsByIdUseCase.Interface,
        private getSettings: GetSettingsUseCase.Interface,
        private encryption: Encryption.Interface
    ) {}

    async execute(fileId: string): Promise<Result<IPreparedImageEnrichment, ImageEnrichmentError>> {
        const fileResult = await this.getFile.execute(fileId);
        if (fileResult.isFail()) {
            return Result.fail(new EnrichmentFileNotFoundError(fileId));
        }

        const file = fileResult.value;

        if (!file.type.startsWith("image/")) {
            return Result.fail(new EnrichmentNotAnImageError(file.type));
        }

        // Read the image bytes and send them to the AI as base64, NOT a URL. A URL forces the
        // provider to fetch the file — which fails for private/access-controlled files, leaks the
        // domain, and can't reach a non-public origin (e.g. local dev). base64 is a portable standard
        // that works on every setup. (Also resolves the AI-SDK "image part" deprecation.)
        const contentsResult = await this.getFileContents.execute(fileId);
        if (contentsResult.isFail()) {
            return Result.fail(new EnrichmentFileContentsError(contentsResult.error.message));
        }

        const aiSettingsResult = await this.getSettings.execute();
        if (aiSettingsResult.isFail()) {
            return Result.fail(new EnrichmentNoProviderError());
        }

        const firstProvider = aiSettingsResult.value.providers.presets[0];
        if (!firstProvider) {
            return Result.fail(new EnrichmentNoProviderError());
        }

        return Result.ok({
            fileId: file.id,
            existingTags: file.tags,
            imageBase64: contentsResult.value.buffer.toString("base64"),
            imageMediaType: contentsResult.value.contentType,
            model: firstProvider.model,
            connection: {
                sdkName: firstProvider.model.split("/")[0],
                apiKey: await this.encryption.decrypt(firstProvider.apiKeyEncrypted)
            }
        });
    }
}

export const PrepareImageEnrichmentUseCase = UseCaseAbstraction.createImplementation({
    implementation: PrepareImageEnrichmentUseCaseImpl,
    dependencies: [GetFileUseCase, GetFileContentsByIdUseCase, GetSettingsUseCase, Encryption]
});

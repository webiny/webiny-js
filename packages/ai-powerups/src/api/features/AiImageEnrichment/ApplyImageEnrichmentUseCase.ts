import { Result } from "@webiny/feature/api";
import { UpdateFileUseCase } from "@webiny/api-file-manager/features/file/UpdateFile/index.js";
import { WebsocketsSendToIdentityUseCase } from "@webiny/api-websockets/features/SendToIdentity/abstractions.js";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import {
    ApplyImageEnrichmentUseCase as UseCaseAbstraction,
    type IApplyImageEnrichmentParams,
    type IAppliedImageEnrichment
} from "./abstractions.js";
import { EnrichmentPersistError } from "./errors.js";
import type { ImageEnrichmentError } from "./errors.js";

export const FILE_ENRICHMENT_WEBSOCKET_ACTION = "fm.file.enrichment";

class ApplyImageEnrichmentUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private updateFile: UpdateFileUseCase.Interface,
        private identityContext: IdentityContext.Interface,
        private sendToIdentity: WebsocketsSendToIdentityUseCase.Interface
    ) {}

    async execute(
        params: IApplyImageEnrichmentParams
    ): Promise<Result<IAppliedImageEnrichment, ImageEnrichmentError>> {
        // Enrichment REPLACES both fields. Tags used to be merged into the file's existing ones while
        // the description was overwritten, which is an odd split: re-running would accumulate tags
        // forever, so a wrong tag from an earlier run could never be dropped by re-running.
        const { tags, description, fileId } = params;

        const updateResult = await this.updateFile.execute({
            id: fileId,
            tags,
            description
        });

        if (updateResult.isFail()) {
            return Result.fail(new EnrichmentPersistError(updateResult.error.message));
        }

        // Push to the identity's open sockets even when the caller is streaming: the browser tab that
        // triggered this isn't necessarily the only one showing the file, and the client-side list
        // cache updates off this message (see AiImageEnrichmentEventHandler in @webiny/app-file-manager).
        const identity = this.identityContext.getIdentity();
        await this.sendToIdentity.execute(
            { id: identity.id },
            {
                action: FILE_ENRICHMENT_WEBSOCKET_ACTION,
                data: { id: fileId, tags, description }
            }
        );

        return Result.ok({ fileId, tags, description });
    }
}

export const ApplyImageEnrichmentUseCase = UseCaseAbstraction.createImplementation({
    implementation: ApplyImageEnrichmentUseCaseImpl,
    dependencies: [UpdateFileUseCase, IdentityContext, WebsocketsSendToIdentityUseCase]
});

import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { WebsocketsSendToIdentityUseCase } from "@webiny/api-websockets/features/SendToIdentity/abstractions.js";
import { compress } from "@webiny/utils/features/compression/legacy/gzip.js";
import { CmsGenerateEntryContentUseCase } from "~/api/features/CmsGenerateEntryContent/index.js";
import type { GenerateEntryContentTelemetry } from "~/api/features/CmsGenerateEntryContent/abstractions.js";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";

export const CMS_GENERATE_ENTRY_CONTENT_TASK_ID = "aiPowerUpsGenerateEntryContent";

export interface ICmsGenerateEntryContentTaskInput {
    prompt: string;
    modelId: string;
    projectId?: string | null;
    excludedFileIds?: string[] | null;
    readerPersonaId?: string | null;
    writerPersonaId?: string | null;
    additionalFileIds?: string[] | null;
}

class CmsGenerateEntryContentTaskImpl implements TaskDefinition.Interface<ICmsGenerateEntryContentTaskInput> {
    id = CMS_GENERATE_ENTRY_CONTENT_TASK_ID;
    title = "AI Power-Ups - Generate Entry Content";
    description = "Generates CMS entry content using AI based on a user prompt.";
    maxIterations = 1;
    isPrivate = true;
    databaseLogs = false;

    constructor(
        private identityContext: IdentityContext.Interface,
        private generateEntryContent: CmsGenerateEntryContentUseCase.Interface,
        private sendToIdentity: WebsocketsSendToIdentityUseCase.Interface
    ) {}

    async run({
        input,
        controller
    }: TaskDefinition.RunParams<ICmsGenerateEntryContentTaskInput>): Promise<
        TaskDefinition.Result<ICmsGenerateEntryContentTaskInput>
    > {
        if (controller.runtime.isAborted()) {
            return controller.response.aborted();
        }

        const result = await this.generateEntryContent.execute({
            prompt: input.prompt,
            modelId: input.modelId,
            projectId: input.projectId,
            excludedFileIds: input.excludedFileIds,
            readerPersonaId: input.readerPersonaId,
            writerPersonaId: input.writerPersonaId,
            additionalFileIds: input.additionalFileIds
        });

        const identity = this.identityContext.getIdentity();

        if (result.isFail()) {
            await this.sendErrorToUser(identity.id, result.error.message);

            return controller.response.error({
                message: result.error.message
            });
        }

        const compressed = await compress(result.value.output);
        const payload = compressed.toString("base64");

        await this.sendContentToUser(identity.id, payload, result.value.telemetry);

        return controller.response.done("Entry content generated successfully.");
    }

    private async sendContentToUser(
        identityId: string,
        payload: string,
        telemetry: GenerateEntryContentTelemetry
    ) {
        await this.sendToIdentity.execute(
            { id: identityId },
            {
                action: "aiPowerUps.generateEntryContent.content",
                data: {
                    compression: "gzip",
                    value: payload,
                    telemetry
                }
            }
        );
    }

    private async sendErrorToUser(identityId: string, message: string) {
        await this.sendToIdentity.execute(
            { id: identityId },
            {
                action: "aiPowerUps.generateEntryContent.error",
                data: {
                    message
                }
            }
        );
    }
}

export const CmsGenerateEntryContentTask = TaskDefinition.createImplementation({
    implementation: CmsGenerateEntryContentTaskImpl,
    dependencies: [IdentityContext, CmsGenerateEntryContentUseCase, WebsocketsSendToIdentityUseCase]
});

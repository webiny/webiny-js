import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { WebsocketsSendToIdentityUseCase } from "@webiny/api-websockets/features/SendToIdentity/abstractions.js";
import { compress } from "@webiny/utils/features/compression/legacy/gzip.js";
import { WbGeneratePageContentUseCase } from "~/api/features/WbGeneratePageContent/index.js";
import type { GenerationTelemetry } from "~/api/features/WbGeneratePageContent/abstractions.js";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";

export const WB_GENERATE_PAGE_CONTENT_TASK_ID = "aiPowerUpsGeneratePageContent";

export interface IWbGeneratePageContentTaskInput {
    prompt: string;
    components: unknown;
    tools: unknown;
    projectId?: string | null;
    excludedFileIds?: string[] | null;
    readerPersonaId?: string | null;
    writerPersonaId?: string | null;
}

class WbGeneratePageContentTaskImpl implements TaskDefinition.Interface<IWbGeneratePageContentTaskInput> {
    id = WB_GENERATE_PAGE_CONTENT_TASK_ID;
    title = "AI Power-Ups - Generate Page Content";
    description = "Generates page content using AI based on a user prompt.";
    maxIterations = 1;
    isPrivate = true;
    databaseLogs = false;

    constructor(
        private identityContext: IdentityContext.Interface,
        private generatePageContent: WbGeneratePageContentUseCase.Interface,
        private sendToIdentity: WebsocketsSendToIdentityUseCase.Interface
    ) {}

    async run({
        input,
        controller
    }: TaskDefinition.RunParams<IWbGeneratePageContentTaskInput>): Promise<
        TaskDefinition.Result<IWbGeneratePageContentTaskInput>
    > {
        if (controller.runtime.isAborted()) {
            return controller.response.aborted();
        }

        const result = await this.generatePageContent.execute({
            prompt: input.prompt,
            components: input.components,
            tools: input.tools,
            projectId: input.projectId,
            excludedFileIds: input.excludedFileIds,
            readerPersonaId: input.readerPersonaId,
            writerPersonaId: input.writerPersonaId
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

        return controller.response.done("Page content generated successfully.");
    }

    private async sendContentToUser(
        identityId: string,
        payload: string,
        telemetry: GenerationTelemetry
    ) {
        await this.sendToIdentity.execute(
            { id: identityId },
            {
                action: "aiPowerUps.generatePageContent.content",
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
                action: "aiPowerUps.generatePageContent.error",
                data: {
                    message
                }
            }
        );
    }
}

export const WbGeneratePageContentTask = TaskDefinition.createImplementation({
    implementation: WbGeneratePageContentTaskImpl,
    dependencies: [IdentityContext, WbGeneratePageContentUseCase, WebsocketsSendToIdentityUseCase]
});

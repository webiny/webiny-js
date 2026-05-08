import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { WebsocketService } from "@webiny/api-websockets/features/WebsocketService/index.js";
import { compress } from "@webiny/utils/features/compression/legacy/gzip.js";
import { WbGeneratePageContentUseCase } from "~/api/features/WbGeneratePageContent/index.js";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";

export const WB_GENERATE_PAGE_CONTENT_TASK_ID = "aiPowerUpsGeneratePageContent";

export interface IWbGeneratePageContentTaskInput {
    prompt: string;
    components: unknown;
    tools: unknown;
    projectId?: string | null;
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
        private websocketService: WebsocketService.Interface
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

        // Send websocket message
        const compressed = await compress(result.value);
        const payload = compressed.toString("base64");

        await this.sendContentToUser(identity.id, payload);

        return controller.response.done("Page content generated successfully.");
    }

    private async sendContentToUser(identityId: string, payload: string) {
        await this.websocketService.send(
            { id: identityId },
            {
                action: "aiPowerUps.generatePageContent.content",
                data: {
                    compression: "gzip",
                    value: payload
                }
            }
        );
    }

    private async sendErrorToUser(identityId: string, message: string) {
        await this.websocketService.send(
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
    dependencies: [IdentityContext, WbGeneratePageContentUseCase, WebsocketService]
});

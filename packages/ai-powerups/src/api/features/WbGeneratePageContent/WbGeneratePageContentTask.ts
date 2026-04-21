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

        console.time("Ask AI");
        const result = await this.generatePageContent.execute({
            prompt: input.prompt,
            components: input.components,
            tools: input.tools
        });

        if (result.isFail()) {
            return controller.response.error({
                message: result.error.message
            });
        }

        // Send websocket message
        console.log(result.value);
        console.timeEnd("Ask AI");
        const identity = this.identityContext.getIdentity();
        const compressed = await compress(result.value);
        const payload = compressed.toString("base64");

        await this.websocketService.send(
            { id: identity.id },
            {
                action: "aiPowerUps.generatePageContent",
                data: {
                    compression: "gzip",
                    value: payload
                }
            }
        );

        return controller.response.done("Page content generated successfully.");
    }
}

export const WbGeneratePageContentTask = TaskDefinition.createImplementation({
    implementation: WbGeneratePageContentTaskImpl,
    dependencies: [IdentityContext, WbGeneratePageContentUseCase, WebsocketService]
});

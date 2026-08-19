import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { WebsocketsSendToIdentityUseCase } from "@webiny/api-websockets/features/SendToIdentity/abstractions.js";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import { GenerateRemoteComponentUseCase } from "./abstractions.js";
import { CreateRemoteComponentUseCase } from "~/api/features/createComponent/abstractions.js";

export const GENERATE_REMOTE_COMPONENT_TASK_ID = "remoteComponentsGenerateComponent";

export interface IGenerateRemoteComponentTaskInput {
    prompt: string;
    name?: string | null;
    label?: string | null;
    description?: string | null;
    additionalFileIds?: string[] | null;
}

class GenerateRemoteComponentTaskImpl implements TaskDefinition.Interface<IGenerateRemoteComponentTaskInput> {
    id = GENERATE_REMOTE_COMPONENT_TASK_ID;
    title = "Remote Components - Generate Component";
    description = "Generates a remote component using AI.";
    maxIterations = 1;
    isPrivate = true;
    databaseLogs = false;

    constructor(
        private identityContext: IdentityContext.Interface,
        private generateComponent: GenerateRemoteComponentUseCase.Interface,
        private createComponent: CreateRemoteComponentUseCase.Interface,
        private sendToIdentity: WebsocketsSendToIdentityUseCase.Interface
    ) {}

    async run({
        input,
        controller
    }: TaskDefinition.RunParams<IGenerateRemoteComponentTaskInput>): Promise<
        TaskDefinition.Result<IGenerateRemoteComponentTaskInput>
    > {
        if (controller.runtime.isAborted()) {
            return controller.response.aborted();
        }

        const identity = this.identityContext.getIdentity();

        let generateResult;
        try {
            generateResult = await this.generateComponent.execute({
                prompt: input.prompt,
                name: input.name ?? undefined,
                label: input.label ?? undefined,
                description: input.description ?? undefined,
                additionalFileIds: input.additionalFileIds ?? undefined
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            await this.sendErrorToUser(identity.id, message);
            return controller.response.error({ message });
        }

        if (generateResult.isFail()) {
            await this.sendErrorToUser(identity.id, generateResult.error.message);
            return controller.response.error({ message: generateResult.error.message });
        }

        const generated = generateResult.value;

        const createResult = await this.createComponent.execute({
            name: generated.name,
            label: generated.label,
            description: generated.description,
            aiContext: generated.aiContext,
            source: generated.source,
            css: generated.css
        });

        if (createResult.isFail()) {
            const message = createResult.error.message;
            await this.sendErrorToUser(identity.id, message);
            return controller.response.error({ message });
        }

        await this.sendToIdentity.execute(
            { id: identity.id },
            {
                action: "remoteComponents.generateComponent.content",
                data: { id: createResult.value.id }
            }
        );

        return controller.response.done("Component generated successfully.");
    }

    private async sendErrorToUser(identityId: string, message: string) {
        await this.sendToIdentity.execute(
            { id: identityId },
            {
                action: "remoteComponents.generateComponent.error",
                data: { message }
            }
        );
    }
}

export const GenerateRemoteComponentTask = TaskDefinition.createImplementation({
    implementation: GenerateRemoteComponentTaskImpl,
    dependencies: [
        IdentityContext,
        GenerateRemoteComponentUseCase,
        CreateRemoteComponentUseCase,
        WebsocketsSendToIdentityUseCase
    ]
});

import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { WebsocketsSendToIdentityUseCase } from "@webiny/api-websockets/features/SendToIdentity/abstractions.js";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import { RefineRemoteComponentUseCase } from "./abstractions.js";

export const REFINE_REMOTE_COMPONENT_TASK_ID = "remoteComponentsRefineComponent";

export interface IRefineRemoteComponentTaskInput {
    currentSource: string;
    currentCss: string;
    feedback: string;
    additionalFileIds?: string[] | null;
}

class RefineRemoteComponentTaskImpl implements TaskDefinition.Interface<IRefineRemoteComponentTaskInput> {
    id = REFINE_REMOTE_COMPONENT_TASK_ID;
    title = "Remote Components - Refine Component";
    description = "Refines an existing remote component using AI.";
    maxIterations = 1;
    isPrivate = true;
    databaseLogs = false;

    constructor(
        private identityContext: IdentityContext.Interface,
        private refineComponent: RefineRemoteComponentUseCase.Interface,
        private sendToIdentity: WebsocketsSendToIdentityUseCase.Interface
    ) {}

    async run({
        input,
        controller
    }: TaskDefinition.RunParams<IRefineRemoteComponentTaskInput>): Promise<
        TaskDefinition.Result<IRefineRemoteComponentTaskInput>
    > {
        if (controller.runtime.isAborted()) {
            return controller.response.aborted();
        }

        const identity = this.identityContext.getIdentity();

        let result;
        try {
            result = await this.refineComponent.execute({
                currentSource: input.currentSource,
                currentCss: input.currentCss,
                feedback: input.feedback,
                additionalFileIds: input.additionalFileIds ?? undefined
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            await this.sendErrorToUser(identity.id, message);
            return controller.response.error({ message });
        }

        if (result.isFail()) {
            await this.sendErrorToUser(identity.id, result.error.message);
            return controller.response.error({ message: result.error.message });
        }

        await this.sendToIdentity.execute(
            { id: identity.id },
            {
                action: "remoteComponents.refineComponent.content",
                data: {
                    source: result.value.source,
                    css: result.value.css
                }
            }
        );

        return controller.response.done("Component refined successfully.");
    }

    private async sendErrorToUser(identityId: string, message: string) {
        await this.sendToIdentity.execute(
            { id: identityId },
            {
                action: "remoteComponents.refineComponent.error",
                data: { message }
            }
        );
    }
}

export const RefineRemoteComponentTask = TaskDefinition.createImplementation({
    implementation: RefineRemoteComponentTaskImpl,
    dependencies: [IdentityContext, RefineRemoteComponentUseCase, WebsocketsSendToIdentityUseCase]
});

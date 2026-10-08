import {
    TaskDefinition,
    TaskHandler
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { WebsocketsSendToIdentityUseCase } from "@webiny/api-websockets/features/SendToIdentity/abstractions.js";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { RefineRemoteComponentUseCase } from "./abstractions.js";

export const REFINE_REMOTE_COMPONENT_TASK_ID = "remoteComponentsRefineComponent";

export interface IRefineRemoteComponentTaskInput {
    currentSource: string;
    currentCss: string;
    feedback: string;
    additionalFileIds?: string[] | null;
}

class RefineRemoteComponentTaskHandlerImpl implements TaskHandler.Interface<IRefineRemoteComponentTaskInput> {
    constructor(
        private identityContext: IdentityContext.Interface,
        private refineComponent: RefineRemoteComponentUseCase.Interface,
        private sendToIdentity: WebsocketsSendToIdentityUseCase.Interface,
        private logger: Logger.Interface
    ) {}

    async run({
        input,
        controller
    }: TaskHandler.RunParams<IRefineRemoteComponentTaskInput>): Promise<
        TaskDefinition.Result<IRefineRemoteComponentTaskInput>
    > {
        if (controller.runtime.isAborted()) {
            return controller.response.aborted();
        }

        const identity = this.identityContext.getIdentity();
        // Messages are addressed to this identity's open sockets, so it has to be the user who
        // triggered the task (TaskControl restores it from the task's createdBy).
        this.logger.info(
            { identityId: identity.id, identityType: identity.type },
            "Refining remote component."
        );

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

        await this.send(identity.id, "remoteComponents.refineComponent.content", {
            source: result.value.source,
            css: result.value.css
        });

        return controller.response.done("Component refined successfully.");
    }

    private async sendErrorToUser(identityId: string, message: string) {
        await this.send(identityId, "remoteComponents.refineComponent.error", { message });
    }

    private async send(identityId: string, action: string, data: Record<string, any>) {
        const result = await this.sendToIdentity.execute({ id: identityId }, { action, data });
        if (result.isFail()) {
            this.logger.error(
                { identityId, action, error: result.error.message },
                "Failed to send websocket message."
            );
        }
    }
}

const RefineRemoteComponentTaskHandler = TaskHandler.createImplementation({
    implementation: RefineRemoteComponentTaskHandlerImpl,
    dependencies: [
        IdentityContext,
        RefineRemoteComponentUseCase,
        WebsocketsSendToIdentityUseCase,
        Logger
    ]
});

class RefineRemoteComponentTaskImpl implements TaskDefinition.Interface {
    id = REFINE_REMOTE_COMPONENT_TASK_ID;
    title = "Remote Components - Refine Component";
    description = "Refines an existing remote component using AI.";
    maxIterations = 1;
    isPrivate = true;
    databaseLogs = false;

    handler = RefineRemoteComponentTaskHandler;
}

export const RefineRemoteComponentTask = TaskDefinition.createImplementation({
    implementation: RefineRemoteComponentTaskImpl,
    dependencies: []
});

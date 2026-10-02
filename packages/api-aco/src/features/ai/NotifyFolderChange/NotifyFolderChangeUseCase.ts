import { createImplementation } from "@webiny/di";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import { WebsocketsSendToIdentityUseCase } from "@webiny/api-websockets/exports/api.js";
import {
    FOLDER_CREATED_WEBSOCKET_ACTION,
    FOLDER_UPDATED_WEBSOCKET_ACTION,
    NotifyFolderChangeUseCase as UseCaseAbstraction
} from "./abstractions.js";

const ACTIONS: Record<UseCaseAbstraction.Params["change"], string> = {
    created: FOLDER_CREATED_WEBSOCKET_ACTION,
    updated: FOLDER_UPDATED_WEBSOCKET_ACTION
};

/*
 * The change is already saved whether or not the message goes out, so the send's result is not the
 * caller's result. When it fails, the admin shows the change after its next reload, as it did before.
 */
class NotifyFolderChangeUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private sendToIdentity: WebsocketsSendToIdentityUseCase.Interface
    ) {}

    async execute({ id, change }: UseCaseAbstraction.Params): Promise<void> {
        const identity = this.identityContext.getIdentity();
        await this.sendToIdentity.execute(
            { id: identity.id },
            { action: ACTIONS[change], data: { id } }
        );
    }
}

export const NotifyFolderChangeUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: NotifyFolderChangeUseCaseImpl,
    dependencies: [IdentityContext, WebsocketsSendToIdentityUseCase]
});

import { createImplementation } from "@webiny/di";
import { IdentityContext } from "~/features/security/IdentityContext/abstractions.js";
import { WebsocketsSendToIdentityUseCase } from "~/features/websockets/index.js";
import {
    USER_CREATED_WEBSOCKET_ACTION,
    USER_DELETED_WEBSOCKET_ACTION,
    USER_UPDATED_WEBSOCKET_ACTION,
    NotifyUserChangeUseCase as UseCaseAbstraction
} from "./abstractions.js";

const ACTIONS: Record<UseCaseAbstraction.Params["change"], string> = {
    created: USER_CREATED_WEBSOCKET_ACTION,
    updated: USER_UPDATED_WEBSOCKET_ACTION,
    deleted: USER_DELETED_WEBSOCKET_ACTION
};

/*
 * Changes the admin makes itself are announced too: the admin applies them by id, so the tab that
 * made the change ends up where it already was and the user's other tabs catch up.
 *
 * The change is saved whether or not the message goes out, so a failed send is swallowed rather than
 * failing the write. The admin then shows the change after its next reload.
 */
class NotifyUserChangeUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private sendToIdentity: WebsocketsSendToIdentityUseCase.Interface
    ) {}

    async execute({ id, change }: UseCaseAbstraction.Params): Promise<void> {
        const recipient = this.identityContext.getIdentity()?.id;
        if (!recipient) {
            return;
        }

        try {
            await this.sendToIdentity.execute(
                { id: recipient },
                { action: ACTIONS[change], data: { id } }
            );
        } catch {
            // See above.
        }
    }
}

export const NotifyUserChangeUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: NotifyUserChangeUseCaseImpl,
    dependencies: [IdentityContext, WebsocketsSendToIdentityUseCase]
});

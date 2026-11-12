import { createImplementation } from "@webiny/di";
import { IdentityContext } from "~/features/security/IdentityContext/abstractions.js";
import { WebsocketsSendToIdentityUseCase } from "~/features/websockets/index.js";
import { ROLE_CREATED_WEBSOCKET_ACTION } from "./abstractions.js";
import { ROLE_DELETED_WEBSOCKET_ACTION } from "./abstractions.js";
import { ROLE_UPDATED_WEBSOCKET_ACTION } from "./abstractions.js";
import { NotifyRoleChangeUseCase as UseCaseAbstraction } from "./abstractions.js";

const ACTIONS: Record<UseCaseAbstraction.Params["change"], string> = {
    created: ROLE_CREATED_WEBSOCKET_ACTION,
    updated: ROLE_UPDATED_WEBSOCKET_ACTION,
    deleted: ROLE_DELETED_WEBSOCKET_ACTION
};

/*
 * Changes the admin makes itself are announced too: the admin applies them by id, so the tab that
 * made the change ends up where it already was and the user's other tabs catch up.
 *
 * The change is saved whether or not the message goes out, so a failed send is swallowed rather than
 * failing the write. The admin then shows the change after its next reload.
 */
class NotifyRoleChangeUseCaseImpl implements UseCaseAbstraction.Interface {
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

export const NotifyRoleChangeUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: NotifyRoleChangeUseCaseImpl,
    dependencies: [IdentityContext, WebsocketsSendToIdentityUseCase]
});

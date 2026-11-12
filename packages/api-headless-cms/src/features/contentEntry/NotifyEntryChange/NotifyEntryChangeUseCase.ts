import { createImplementation } from "@webiny/di";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import { WebsocketsSendToIdentityUseCase } from "@webiny/api-core/features/websockets/index.js";
import {
    ENTRY_CREATED_WEBSOCKET_ACTION,
    ENTRY_DELETED_WEBSOCKET_ACTION,
    ENTRY_UPDATED_WEBSOCKET_ACTION,
    NotifyEntryChangeUseCase as UseCaseAbstraction
} from "./abstractions.js";

const ACTIONS: Record<UseCaseAbstraction.Params["change"], string> = {
    created: ENTRY_CREATED_WEBSOCKET_ACTION,
    updated: ENTRY_UPDATED_WEBSOCKET_ACTION,
    deleted: ENTRY_DELETED_WEBSOCKET_ACTION
};

/*
 * Called explicitly (today by the assistant's entry tools), not from the entry lifecycle events the
 * way team, role and user changes are announced. Entries are written in bulk (imports, bulk actions, scheduled publishing), and a
 * message per write would mean a websocket send per entry and an admin read-back per message.
 *
 * The change is saved whether or not the message goes out, so a failed send is swallowed rather than
 * failing the tool. The admin then shows the change after its next reload.
 */
class NotifyEntryChangeUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private sendToIdentity: WebsocketsSendToIdentityUseCase.Interface
    ) {}

    async execute({ modelId, entryId, change }: UseCaseAbstraction.Params): Promise<void> {
        const recipient = this.identityContext.getIdentity()?.id;
        if (!recipient) {
            return;
        }

        try {
            await this.sendToIdentity.execute(
                { id: recipient },
                { action: ACTIONS[change], data: { modelId, entryId } }
            );
        } catch {
            // See above.
        }
    }
}

export const NotifyEntryChangeUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: NotifyEntryChangeUseCaseImpl,
    dependencies: [IdentityContext, WebsocketsSendToIdentityUseCase]
});

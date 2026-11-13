import { createImplementation } from "@webiny/di";
import { IdentityContext } from "~/features/security/IdentityContext/abstractions.js";
import { WebsocketsSendToIdentityUseCase } from "~/features/websockets/SendToIdentity/abstractions.js";
import { RECORD_CHANGED_WEBSOCKET_ACTION } from "./abstractions.js";
import { NotifyRecordChangeUseCase as UseCaseAbstraction } from "./abstractions.js";

/*
 * Changes the admin makes itself are announced too: the admin applies them by id, so the tab that
 * made the change ends up where it already was and the user's other tabs catch up.
 *
 * The change is saved whether or not the message goes out, so a failed send is swallowed rather than
 * failing the write. The admin then shows the change after its next reload.
 */
class NotifyRecordChangeUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private sendToIdentity: WebsocketsSendToIdentityUseCase.Interface
    ) {}

    async execute({ identityId, ...data }: UseCaseAbstraction.Params): Promise<void> {
        const recipient = identityId ?? this.identityContext.getIdentity()?.id;
        if (!recipient) {
            return;
        }

        try {
            await this.sendToIdentity.execute(
                { id: recipient },
                { action: RECORD_CHANGED_WEBSOCKET_ACTION, data }
            );
        } catch {
            // See above.
        }
    }
}

export const NotifyRecordChangeUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: NotifyRecordChangeUseCaseImpl,
    dependencies: [IdentityContext, WebsocketsSendToIdentityUseCase]
});

import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { WebsocketsSendToIdentityUseCase } from "@webiny/api-websockets/features/SendToIdentity/abstractions.js";
import { parseIdentifier } from "@webiny/utils";
import { KickOutCurrentUserUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { ILockRecord } from "~/domain/index.js";

class KickOutCurrentUserUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private sendToIdentity: WebsocketsSendToIdentityUseCase.Interface
    ) {}

    async execute(record: ILockRecord): Promise<Result<void, UseCaseAbstraction.Error>> {
        const { lockedBy, id } = record;

        const { id: entryId } = parseIdentifier(id);
        const identity = this.identityContext.getIdentity();

        await this.sendToIdentity.execute(
            { id: lockedBy.id },
            {
                action: `recordLocking.entry.kickOut.${entryId}`,
                data: {
                    record: record.toObject(),
                    user: identity
                }
            }
        );

        return Result.ok();
    }
}

export const KickOutCurrentUserUseCase = UseCaseAbstraction.createImplementation({
    implementation: KickOutCurrentUserUseCaseImpl,
    dependencies: [IdentityContext, WebsocketsSendToIdentityUseCase]
});

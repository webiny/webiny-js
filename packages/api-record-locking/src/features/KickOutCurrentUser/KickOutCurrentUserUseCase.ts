import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { WebsocketService } from "@webiny/api-websockets/features/WebsocketService/index.js";
import { parseIdentifier } from "@webiny/utils";
import { KickOutCurrentUserUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { ILockRecord } from "~/domain/index.js";

class KickOutCurrentUserUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private websocketService?: WebsocketService.Interface
    ) {}

    async execute(record: ILockRecord): Promise<Result<void, UseCaseAbstraction.Error>> {
        if (!this.websocketService) {
            return Result.ok();
        }

        const { lockedBy, id } = record;

        const { id: entryId } = parseIdentifier(id);
        const identity = this.identityContext.getIdentity();

        await this.websocketService.send(
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
    dependencies: [IdentityContext, [WebsocketService, { optional: true }]]
});

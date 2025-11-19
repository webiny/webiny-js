import { Result } from "@webiny/feature/api";
import { WebsocketsContext } from "@webiny/api-websockets/features/WebsocketsContext";
import { IdentityContext } from "@webiny/api-core/features/IdentityContext";
import { parseIdentifier } from "@webiny/utils";
import { KickOutCurrentUserUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { ILockRecord } from "~/domain/index.js";

class KickOutCurrentUserUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private websocketsContext: WebsocketsContext.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    async execute(record: ILockRecord): Promise<Result<void, UseCaseAbstraction.Error>> {
        const { lockedBy, id } = record;

        const { id: entryId } = parseIdentifier(id);
        const identity = this.identityContext.getIdentity();

        /**
         * We do not want any errors to leak out of this method.
         */
        try {
            await this.websocketsContext.send(
                { id: lockedBy.id },
                {
                    action: `recordLocking.entry.kickOut.${entryId}`,
                    data: {
                        record: record.toObject(),
                        user: identity
                    }
                }
            );
        } catch (error) {
            console.error(
                `Could not send the kickOut message to a user with identity id: ${lockedBy.id}. More info in next log line.`
            );
            console.info(error);
        }

        return Result.ok();
    }
}

export const KickOutCurrentUserUseCase = UseCaseAbstraction.createImplementation({
    implementation: KickOutCurrentUserUseCaseImpl,
    dependencies: [WebsocketsContext, IdentityContext]
});

import { Result } from "@webiny/feature/api";
import type { GenericRecord } from "@webiny/api/types.js";
import { Logger } from "~/features/logger/index.js";
import { WebsocketsSendToIdentityUseCase } from "./abstractions.js";

/**
 * The default when no websockets package is installed: there are no connections to send to, so the
 * send succeeds without doing anything. `@webiny/api-websockets` registers after api-core and replaces it.
 *
 * Logged at debug level, so that a handler stack that forgot to register websockets can be told apart
 * from a user who simply has no tab open.
 */
class NullSendToIdentityUseCaseImpl implements WebsocketsSendToIdentityUseCase.Interface {
    constructor(private readonly logger: Logger.Interface) {}

    async execute(
        identity: WebsocketsSendToIdentityUseCase.Identity,
        data: WebsocketsSendToIdentityUseCase.Data<GenericRecord>
    ) {
        this.logger.debug(
            { identityId: identity.id, action: data.action },
            "No websockets package registered; message not sent."
        );
        return Result.ok();
    }
}

export const NullSendToIdentityUseCase = WebsocketsSendToIdentityUseCase.createImplementation({
    implementation: NullSendToIdentityUseCaseImpl,
    dependencies: [Logger]
});

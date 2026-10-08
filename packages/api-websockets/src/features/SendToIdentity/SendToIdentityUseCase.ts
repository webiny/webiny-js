import { Result } from "@webiny/feature/api";
import type { GenericRecord } from "@webiny/api/types.js";
import { WebsocketsListConnectionsUseCase } from "~/features/ListConnections/abstractions.js";
import { WebsocketsTransport } from "~/transport/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { WebsocketsSendToIdentityUseCase } from "./abstractions.js";
import type { WebsocketsError } from "~/features/shared/errors.js";
import { WebsocketServiceError } from "~/features/shared/errors.js";

class SendToIdentityUseCaseImpl implements WebsocketsSendToIdentityUseCase.Interface {
    public constructor(
        private readonly listConnections: WebsocketsListConnectionsUseCase.Interface,
        private readonly transport: WebsocketsTransport.Interface,
        private readonly logger: Logger.Interface
    ) {}

    public async execute<T extends GenericRecord = GenericRecord>(
        identity: WebsocketsSendToIdentityUseCase.Identity,
        data: WebsocketsSendToIdentityUseCase.Data<T>
    ): Promise<Result<void, WebsocketsError>> {
        const result = await this.listConnections.execute({
            where: {
                identityId: identity.id
            }
        });

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        if (result.value.length === 0) {
            // Not an error for the caller (the user may simply have no tab open), but without this
            // an identity mismatch between sender and connection is indistinguishable from success.
            this.logger.warn(
                { identityId: identity.id, action: data.action },
                "No websocket connections found for identity; message not sent."
            );
        }

        try {
            await this.transport.send<T>(result.value, data);
        } catch (error) {
            return Result.fail(new WebsocketServiceError(error as Error));
        }

        return Result.ok();
    }
}

export const SendToIdentityUseCase = WebsocketsSendToIdentityUseCase.createImplementation({
    implementation: SendToIdentityUseCaseImpl,
    dependencies: [WebsocketsListConnectionsUseCase, WebsocketsTransport, Logger]
});

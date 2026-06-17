import { Result } from "@webiny/feature/api";
import type { GenericRecord } from "@webiny/api/types.js";
import type { IWebsocketsIdentity } from "~/types.js";
import type { IWebsocketsTransport } from "~/transport/index.js";
import type { IWebsocketsTransportSendData } from "~/transport/index.js";
import type { IListConnectionsUseCase } from "~/features/ListConnections/abstractions.js";
import type { ISendToIdentityUseCase } from "./abstractions.js";
import type { WebsocketsError } from "~/features/shared/errors.js";
import { WebsocketServiceError } from "~/features/shared/errors.js";

export class SendToIdentityUseCase implements ISendToIdentityUseCase {
    private readonly listConnections: IListConnectionsUseCase;
    private readonly transport: IWebsocketsTransport;

    constructor(listConnections: IListConnectionsUseCase, transport: IWebsocketsTransport) {
        this.listConnections = listConnections;
        this.transport = transport;
    }

    public async execute<T extends GenericRecord = GenericRecord>(
        identity: Pick<IWebsocketsIdentity, "id">,
        data: IWebsocketsTransportSendData<T>
    ): Promise<Result<void, WebsocketsError>> {
        const result = await this.listConnections.execute({
            where: {
                identityId: identity.id
            }
        });

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        try {
            await this.transport.send<T>(result.value, data);
        } catch (error) {
            return Result.fail(new WebsocketServiceError(error as Error));
        }

        return Result.ok();
    }
}

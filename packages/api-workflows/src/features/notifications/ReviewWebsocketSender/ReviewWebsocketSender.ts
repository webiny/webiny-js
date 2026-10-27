import { Logger } from "@webiny/api-core/features/logger/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import {
    WebsocketsListConnectionsUseCase,
    WebsocketsSendToConnectionsUseCase
} from "@webiny/api-websockets/exports/api.js";
import { NOTIFICATION_SEND_CONCURRENCY } from "~/features/notifications/shared/constants.js";
import { getErrorLogFields } from "~/features/notifications/shared/getErrorLogFields.js";
import { ReviewWebsocketSender as Abstraction } from "./abstractions.js";

const WEBSOCKET_TEXT = "Could not send a workflow websocket notification.";

class ReviewWebsocketSenderImpl implements Abstraction.Interface {
    public constructor(
        private listConnections: WebsocketsListConnectionsUseCase.Interface,
        private sendToConnections: WebsocketsSendToConnectionsUseCase.Interface,
        private tenantContext: TenantContext.Interface,
        private logger: Logger.Interface
    ) {}

    public async send(params: Abstraction.SendParams): Promise<void> {
        const { reviewId, event, action, data } = params;

        // One entry per id. An empty or missing id never reaches the list use case:
        // `identityId: ""` would list every connection.
        const uniqueIds = [...new Set(params.recipientIds)];
        const recipientIds = uniqueIds.filter(id => typeof id === "string" && id !== "");
        if (recipientIds.length === 0) {
            return;
        }

        let tenantId: string | undefined;
        let tenantError: unknown;
        try {
            tenantId = this.tenantContext.getTenant()?.id;
        } catch (error) {
            tenantError = error;
        }

        if (typeof tenantId !== "string" || tenantId === "") {
            // No current tenant: nothing is sent (a frame must never leave the review's tenant),
            // and the failure is logged once for all recipients.
            this.logger.error(
                { ...getErrorLogFields(tenantError), reviewId, event },
                WEBSOCKET_TEXT
            );
            return;
        }

        const currentTenantId = tenantId;
        for (let start = 0; start < recipientIds.length; start += NOTIFICATION_SEND_CONCURRENCY) {
            const batch = recipientIds.slice(start, start + NOTIFICATION_SEND_CONCURRENCY);
            // oxlint-disable-next-line no-await-in-loop -- sends go out in parallel batches of a fixed size.
            await Promise.all(
                batch.map(async recipientId => {
                    try {
                        const listed = await this.listConnections.execute({
                            where: { identityId: recipientId }
                        });
                        if (listed.isFail()) {
                            this.logger.error(
                                {
                                    ...getErrorLogFields(listed.error),
                                    errorMessage: listed.error.message,
                                    reviewId,
                                    event,
                                    recipientId
                                },
                                WEBSOCKET_TEXT
                            );
                            return;
                        }

                        // The same user can be connected in other tenants (A63).
                        const connections = listed.value
                            .filter(connection => connection.tenant === currentTenantId)
                            .map(connection => ({
                                connectionId: connection.connectionId,
                                endpoint: connection.endpoint
                            }));
                        if (connections.length === 0) {
                            return;
                        }

                        const sent = await this.sendToConnections.execute(connections, {
                            action,
                            data
                        });
                        if (sent.isFail()) {
                            this.logger.error(
                                {
                                    ...getErrorLogFields(sent.error),
                                    errorMessage: sent.error.message,
                                    reviewId,
                                    event,
                                    recipientId
                                },
                                WEBSOCKET_TEXT
                            );
                        }
                    } catch (error) {
                        this.logger.error(
                            {
                                ...getErrorLogFields(error),
                                errorMessage: error instanceof Error ? error.message : undefined,
                                reviewId,
                                event,
                                recipientId
                            },
                            WEBSOCKET_TEXT
                        );
                    }
                })
            );
        }
    }
}

export const ReviewWebsocketSender = Abstraction.createImplementation({
    implementation: ReviewWebsocketSenderImpl,
    dependencies: [
        WebsocketsListConnectionsUseCase,
        WebsocketsSendToConnectionsUseCase,
        TenantContext,
        Logger
    ]
});

/**
 * DI-native WebSocket Lambda handler.
 *
 * Receives AWS API Gateway WebSocket events ($connect, $disconnect, $default)
 * and routes them through WebSocketLambdaHandler, which runs WebsocketsRunner.
 * Route handlers are resolved from the DI container (registered by WebsocketsFeature).
 */
import { getDocumentClient } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { createLambdaHandler, WebSocketEventType } from "@webiny/event-handler-aws";
import { WebSocketLambdaHandler, WebsocketsFeature } from "@webiny/api-websockets";
import { WebsocketsDdbFeature } from "@webiny/api-websockets-ddb";
import { DbFeature } from "@webiny/handler-db";
import { ApiCoreFeature } from "@webiny/api-core";
import { createApiCoreDdb } from "@webiny/api-core-ddb";

const documentClient = getDocumentClient();

export const handler = createLambdaHandler({
    root: async container => {
        // ── WebSocket event routing ────────────────────────────────
        container.register(WebSocketEventType);
        container.register(WebSocketLambdaHandler);

        // ── Database ───────────────────────────────────────────────
        DbFeature.register(container, {
            documentClient,
            table: process.env.DB_TABLE
        });

        // ── Core API + DDB storage ────────────────────────────────
        ApiCoreFeature.register(container, {
            ...createApiCoreDdb({ documentClient }),
            wcpLicense: undefined
        });

        WebsocketsDdbFeature.register(container);
    },

    request: async container => {
        // ── Websockets context + GraphQL (sets up context.websockets) ──
        WebsocketsFeature.register(container);
    }
});

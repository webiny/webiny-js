import { NetworkErrorEventHandler } from "./abstractions.js";
import { BaseEvent } from "~/features/eventPublisher/index.js";

export interface NetworkErrorPayload {
    message: string;
    code?: string;
    operationName?: string;
    query?: string;
    variables?: Record<string, any>;
    errorType: "network" | "timeout" | "fetch" | "unknown";
    statusCode?: number;
    result?: any;
}

export class NetworkErrorEvent extends BaseEvent<NetworkErrorPayload> {
    eventType = "network.error" as const;

    getHandlerAbstraction() {
        return NetworkErrorEventHandler;
    }
}

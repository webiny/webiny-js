export interface EventBridgeClientSendResponseEntry {
    EventId: string;
}

export interface EventBridgeClientSendResponse {
    $metadata: {
        httpStatusCode: number;
        requestId: string;
        attempts: number;
        totalRetryDelay: number;
    };
    Entries: EventBridgeClientSendResponseEntry[];
    FailedEntryCount: number;
}

/**
 * This is what the event looks like when it's received from EventBridge.
 */
export interface IIncomingEventBridgeEvent {
    version: `${number}`;
    id: string;
    "detail-type": string;
    source: string;
    account: string;
    time: string;
    region: string;
    resources: unknown[];
    detail: {
        [key: string]: any;
    };
}

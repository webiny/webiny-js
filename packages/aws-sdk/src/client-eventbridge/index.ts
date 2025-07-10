import type { EventBridgeClientConfig } from "@aws-sdk/client-eventbridge";
import { EventBridgeClient } from "@aws-sdk/client-eventbridge";

export {
    EventBridgeClient,
    PutEventsRequestEntry,
    PutEventsCommand
} from "@aws-sdk/client-eventbridge";

export type {
    EventBridgeClientConfig,
    PutEventsCommandInput,
    PutEventsCommandOutput
} from "@aws-sdk/client-eventbridge";

export const createEventBridgeClient = (config?: Partial<EventBridgeClientConfig>) => {
    return new EventBridgeClient({
        ...config
    });
};

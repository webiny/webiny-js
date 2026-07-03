import { createFeature } from "@webiny/feature/api";
import { S3EventType } from "../eventTypes/S3EventType.js";

/**
 * Registers transport-only S3 event handling: the event type (recognises S3 Lambda events).
 *
 * Tenant establishment for S3 events (the S3TenantLoaderDecorator, which depends on api-core) lives
 * in the composition layer (@webiny/api-event-handler-aws); a composer that handles S3 events registers it
 * on top of this feature. Keeps event-handler-aws free of any api-* (domain) dependency.
 */
export const S3Feature = createFeature({
    name: "S3",
    register(container) {
        container.register(S3EventType);
    }
});

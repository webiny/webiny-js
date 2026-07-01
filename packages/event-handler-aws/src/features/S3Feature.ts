import { createFeature } from "@webiny/feature/api";
import { S3EventType } from "../eventTypes/S3EventType.js";
import { S3TenantIdExtractor } from "../extractors/S3TenantIdExtractor.js";
import { S3TenantEstablisherDecorator } from "../handlers/S3TenantEstablisherDecorator.js";

/**
 * Registers S3 event handling: the event type + tenant establishment. Tenant is established the same
 * way as for API Gateway — the transport-specific extractor (S3 bucket name) is registered under the
 * shared TenantIdExtractor token, and a thin decorator drives the shared RequestTenantEstablisher
 * over the S3 event-handler chain. The app supplies the actual S3 business handler(s); this decorator
 * wraps them so the tenant is established before they run.
 */
export const S3Feature = createFeature({
    name: "S3",
    register(container) {
        container.register(S3EventType);
        container.register(S3TenantIdExtractor);
        container.registerDecorator(S3TenantEstablisherDecorator);
    }
});

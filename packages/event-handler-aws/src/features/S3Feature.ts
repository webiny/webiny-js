import { createFeature } from "@webiny/feature/api";
import { S3EventType } from "../eventTypes/S3EventType.js";
import { S3TenantLoaderDecorator } from "../handlers/S3TenantLoaderDecorator.js";

/**
 * Registers S3 event handling: the event type + tenant establishment. Tenant is established the same
 * way as for API Gateway — a decorator EXTRACTS the tenant id from the S3 bucket name into
 * RawTenantId and invokes the shared RequestTenantLoader over the S3 event-handler chain. The
 * app supplies the actual S3 business handler(s); this decorator wraps them so the tenant is
 * established before they run.
 */
export const S3Feature = createFeature({
    name: "S3",
    register(container) {
        container.register(S3EventType);
        container.registerDecorator(S3TenantLoaderDecorator);
    }
});

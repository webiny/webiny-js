import { createFeature } from "@webiny/feature/api";
import { S3InputType } from "../inputTypes/S3InputType.js";

/**
 * Registers transport-only S3 event handling: the event type (recognises S3 Lambda events).
 *
 * The tenant of an S3 event (the S3TenantSource, which depends on api-core) lives in the composition
 * layer (@webiny/api-composition-aws); a composer that handles S3 events registers it on top of this
 * feature. Keeps api-kernel-aws free of any api-* (domain) dependency.
 */
export const S3Feature = createFeature({
    name: "S3",
    register(container) {
        container.register(S3InputType);
    }
});

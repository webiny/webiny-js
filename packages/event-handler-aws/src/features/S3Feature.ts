import { createFeature } from "@webiny/feature/api";
import { S3EventType } from "../eventTypes/S3EventType.js";
import { S3TenantIdExtractorImpl } from "../extractors/S3TenantIdExtractor.js";
import { S3TenantInitializer } from "../handlers/S3TenantInitializer.js";

export const S3Feature = createFeature({
    name: "S3",
    register(container) {
        container.register(S3EventType);
        container.register(S3TenantIdExtractorImpl);
        container.register(S3TenantInitializer);
    }
});

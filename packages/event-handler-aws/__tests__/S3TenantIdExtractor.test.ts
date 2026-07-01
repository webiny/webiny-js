import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { TenantIdExtractor } from "@webiny/api-core/features/requestContext/index.js";
import { S3TenantIdExtractor } from "~/extractors/S3TenantIdExtractor.js";

function makeEvent(bucketName: string) {
    return {
        Records: [
            {
                eventSource: "aws:s3",
                s3: { bucket: { name: bucketName }, object: { key: "img.png" } }
            }
        ]
    } as any;
}

function resolveExtractor() {
    const container = new Container();
    // S3TenantIdExtractor is now a real implementation registered under the SHARED TenantIdExtractor
    // token (same seam every transport uses), not its own abstraction.
    container.register(S3TenantIdExtractor);
    return container.resolve(TenantIdExtractor);
}

describe("S3TenantIdExtractor", () => {
    it("should extract tenant from bucket name prefix", () => {
        const extractor = resolveExtractor();
        expect(extractor.extract(makeEvent("acme-uploads"))).toBe("acme");
        expect(extractor.extract(makeEvent("tenant123-files"))).toBe("tenant123");
    });

    it("should return first segment only", () => {
        const extractor = resolveExtractor();
        expect(extractor.extract(makeEvent("acme-us-east-1-uploads"))).toBe("acme");
    });

    it("should return null when no records", () => {
        const extractor = resolveExtractor();
        expect(extractor.extract({ Records: [] } as any)).toBeNull();
    });

    it("should return null for a non-S3 event (safe no-op under the shared token)", () => {
        const extractor = resolveExtractor();
        // An API Gateway-shaped event has no S3 Records — the extractor must not throw and must
        // return null so it's simply skipped by RequestTenantEstablisher.
        expect(extractor.extract({ headers: { "x-tenant": "acme" } } as any)).toBeNull();
        expect(extractor.extract(undefined as any)).toBeNull();
    });
});

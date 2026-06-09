import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
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
    container.register(
        S3TenantIdExtractor.createImplementation({
            implementation: class {
                extract(event: any) {
                    const bucket = event.Records[0]?.s3.bucket.name;
                    if (!bucket) {
                        return undefined;
                    }
                    return bucket.split("-")[0];
                }
            },
            dependencies: []
        })
    );
    return container.resolve(S3TenantIdExtractor);
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

    it("should return undefined when no records", () => {
        const extractor = resolveExtractor();
        expect(extractor.extract({ Records: [] } as any)).toBeUndefined();
    });
});

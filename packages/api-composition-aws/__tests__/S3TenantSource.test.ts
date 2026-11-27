import { describe, it, expect } from "vitest";
import { S3InputHandler, SqsInputHandler } from "@webiny/api-kernel-aws";
import type { InputChainRunner } from "@webiny/api-kernel-core";
import { Container } from "@webiny/di";
import { S3TenantSource } from "~/handlers/S3TenantSource.js";

function s3Event(bucketName: string): any {
    return {
        Records: [
            {
                eventSource: "aws:s3",
                s3: { bucket: { name: bucketName }, object: { key: "img.png" } }
            }
        ]
    };
}

const request = (event: any, abstraction: any = S3InputHandler): InputChainRunner.Request => {
    return { container: new Container(), abstraction, input: event };
};

describe("S3TenantSource", () => {
    const source = new (S3TenantSource as any)();

    it("names the tenant the bucket name starts with, and runs an unknown one as root", () => {
        expect(source.getTenant(request(s3Event("acme-uploads")))).toEqual({
            tenantId: "acme",
            ifUnknown: "root"
        });
    });

    it("takes only the first bucket-name segment", () => {
        expect(source.getTenant(request(s3Event("acme-eu-central-1-uploads"))).tenantId).toBe(
            "acme"
        );
    });

    it("names no tenant when there is no bucket (the root tenant)", () => {
        expect(source.getTenant(request({ Records: [] })).tenantId).toBeNull();
    });

    it("doesn't know events of other handlers", () => {
        expect(source.getTenant(request(s3Event("acme-uploads"), SqsInputHandler))).toBeUndefined();
    });
});

import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { RawTenantId as RawTenantIdImpl } from "@webiny/api-core/features/requestContext/RawTenantId.js";
import { RawTenantId } from "@webiny/api-core/features/requestContext/index.js";
import { RequestTenantLoader } from "@webiny/api-core/features/requestContext/index.js";
import { TenantNotFoundError } from "@webiny/api-core/features/requestContext/index.js";
import { S3EventHandler } from "@webiny/event-handler-aws";
import { S3TenantLoaderDecorator } from "~/handlers/S3TenantLoaderDecorator.js";

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

function setup(loadError?: Error) {
    const container = new Container();
    container.register(RawTenantIdImpl).inSingletonScope();

    let establishCalled = false;
    container.registerInstance(RequestTenantLoader, {
        async establish() {
            establishCalled = true;
            if (loadError) {
                throw loadError;
            }
        }
    });

    let innerCalled = false;
    container.registerInstance(S3EventHandler, {
        async execute() {
            innerCalled = true;
        }
    });
    container.registerDecorator(S3TenantLoaderDecorator);

    return {
        handler: container.resolve(S3EventHandler),
        rawTenantId: () => container.resolve(RawTenantId).get(),
        establishCalled: () => establishCalled,
        innerCalled: () => innerCalled
    };
}

describe("S3TenantLoaderDecorator", () => {
    it("extracts tenant from the bucket name into RawTenantId, runs the load, then the inner handler", async () => {
        const t = setup();
        await t.handler.execute(
            { event: s3Event("acme-uploads"), metadata: {} } as any,
            async () => undefined
        );

        expect(t.rawTenantId()).toBe("acme");
        expect(t.establishCalled()).toBe(true);
        expect(t.innerCalled()).toBe(true);
    });

    it("takes only the first bucket-name segment", async () => {
        const t = setup();
        await t.handler.execute(
            { event: s3Event("acme-eu-central-1-uploads"), metadata: {} } as any,
            async () => undefined
        );
        expect(t.rawTenantId()).toBe("acme");
    });

    it("sets null when there is no bucket (loader then defaults to root)", async () => {
        const t = setup();
        await t.handler.execute(
            { event: { Records: [] }, metadata: {} } as any,
            async () => undefined
        );
        expect(t.rawTenantId()).toBeNull();
        expect(t.establishCalled()).toBe(true);
    });

    it("still runs the inner handler when the bucket prefix is not a known tenant", async () => {
        const t = setup(new TenantNotFoundError("files"));
        await t.handler.execute(
            { event: s3Event("files-uploads"), metadata: {} } as any,
            async () => undefined
        );
        expect(t.innerCalled()).toBe(true);
    });

    it("rethrows any other load error", async () => {
        const t = setup(new Error("storage is down"));
        const run = t.handler.execute(
            { event: s3Event("acme-uploads"), metadata: {} } as any,
            async () => undefined
        );
        await expect(run).rejects.toThrow("storage is down");
        expect(t.innerCalled()).toBe(false);
    });
});

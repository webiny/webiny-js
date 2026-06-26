import { describe, it, expect, beforeEach } from "vitest";
import { Container } from "@webiny/di";
import { AssetDeliveryFeature } from "~/features/assetDelivery/feature.js";
import { AssetRequestResolver } from "~/features/assetDelivery/abstractions/AssetRequestResolver.js";
import { AssetResolver } from "~/features/assetDelivery/abstractions/AssetResolver.js";
import { AssetProcessor } from "~/features/assetDelivery/abstractions/AssetProcessor.js";
import { AssetOutputStrategy } from "~/features/assetDelivery/abstractions/AssetOutputStrategy.js";
import { AssetTransformationStrategy } from "~/features/assetDelivery/abstractions/AssetTransformationStrategy.js";
import { AssetFactory } from "~/features/assetDelivery/Asset/abstractions.js";
import { AssetRequestFactory } from "~/features/assetDelivery/AssetRequest/abstractions.js";
import { ObjectKey } from "~/features/assetDelivery/ObjectKey/abstractions.js";
import { StreamAssetReply } from "~/features/assetDelivery/StreamAssetReply/abstractions.js";
import { AssetAuthorizer } from "~/features/assetDelivery/abstractions/AssetAuthorizer.js";
import { Asset } from "~/delivery/AssetDelivery/Asset.js";
import { AssetReply } from "~/delivery/AssetDelivery/abstractions/AssetReply.js";
import { WcpContext } from "@webiny/api-core/features/wcp/WcpContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetFileUseCase } from "~/features/file/GetFile/index.js";

const createMockWcpContext = (privateFiles = false): WcpContext.Interface => ({
    getProject: () => null,
    getProjectWithFeatureFlags: () => null,
    getProjectLicense: () => ({}) as any,
    getProjectEnvironment: () => null,
    ensureCanUseFeature: () => undefined,
    incrementSeats: async () => undefined,
    decrementSeats: async () => undefined,
    incrementTenants: async () => undefined,
    decrementTenants: async () => undefined,
    getRawLicense: () => null,
    toDto: () => null,
    canUseFeature: () => false,
    canUseAacl: () => false,
    canUseTeams: () => false,
    canUseAuditLogs: () => false,
    canUsePrivateFiles: () => privateFiles,
    canUseFileManagerThreatDetection: () => false,
    canUseFolderLevelPermissions: () => false,
    canUseRecordLocking: () => false,
    canUseWorkflows: () => false,
    canUseHcmsFieldPermissions: () => false,
    canUseAiImageEnrichment: () => false,
    canUseAiPageGeneration: () => false,
    canUseAiLexicalGeneration: () => false
});

describe("AssetDelivery DI integration", () => {
    let container: Container;

    beforeEach(() => {
        container = new Container();
        container.registerInstance(WcpContext, createMockWcpContext());
        AssetDeliveryFeature.register(container);
    });

    describe("abstraction resolution", () => {
        it("should resolve AssetFactory", () => {
            const factory = container.resolve(AssetFactory);
            expect(factory).toBeDefined();
        });

        it("should resolve AssetRequestFactory", () => {
            const factory = container.resolve(AssetRequestFactory);
            expect(factory).toBeDefined();
        });

        it("should resolve AssetRequestResolver", () => {
            const resolver = container.resolve(AssetRequestResolver);
            expect(resolver).toBeDefined();
        });

        it("should resolve AssetResolver", () => {
            const resolver = container.resolve(AssetResolver);
            expect(resolver).toBeDefined();
        });

        it("should resolve AssetProcessor", () => {
            const processor = container.resolve(AssetProcessor);
            expect(processor).toBeDefined();
        });

        it("should resolve AssetOutputStrategy", () => {
            const strategy = container.resolve(AssetOutputStrategy);
            expect(strategy).toBeDefined();
        });

        it("should resolve AssetTransformationStrategy", () => {
            const strategy = container.resolve(AssetTransformationStrategy);
            expect(strategy).toBeDefined();
        });

        it("should resolve ObjectKey", () => {
            const objectKey = container.resolve(ObjectKey);
            expect(objectKey).toBeDefined();
        });

        it("should resolve StreamAssetReply", () => {
            const streamReply = container.resolve(StreamAssetReply);
            expect(streamReply).toBeDefined();
        });
    });

    describe("singleton scope", () => {
        it("should return the same AssetFactory instance on multiple resolves", () => {
            const first = container.resolve(AssetFactory);
            const second = container.resolve(AssetFactory);
            expect(first).toBe(second);
        });

        it("should return the same AssetRequestFactory instance on multiple resolves", () => {
            const first = container.resolve(AssetRequestFactory);
            const second = container.resolve(AssetRequestFactory);
            expect(first).toBe(second);
        });

        it("should return the same ObjectKey instance on multiple resolves", () => {
            const first = container.resolve(ObjectKey);
            const second = container.resolve(ObjectKey);
            expect(first).toBe(second);
        });

        it("should return the same StreamAssetReply instance on multiple resolves", () => {
            const first = container.resolve(StreamAssetReply);
            const second = container.resolve(StreamAssetReply);
            expect(first).toBe(second);
        });
    });

    describe("AssetFactory", () => {
        it("should create an Asset with the given data", () => {
            const factory = container.resolve(AssetFactory);
            const asset = factory.create({
                id: "file-1",
                tenant: "root",
                key: "tenants/root/files/file-1/image.jpg",
                size: 2048,
                contentType: "image/jpeg"
            });

            expect(asset).toBeInstanceOf(Asset);
            expect(asset.getId()).toBe("file-1");
            expect(asset.getTenant()).toBe("root");
            expect(asset.getKey()).toBe("tenants/root/files/file-1/image.jpg");
            expect(asset.getSize()).toBe(2048);
            expect(asset.getContentType()).toBe("image/jpeg");
        });
    });

    describe("AssetRequestFactory", () => {
        it("should create an AssetRequest with the given data", () => {
            const factory = container.resolve(AssetRequestFactory);
            const request = factory.create({
                key: "file-1/image.jpg",
                context: { url: "/files/file-1/image.jpg" },
                options: { original: false, width: 300 }
            });

            expect(request.getKey()).toBe("file-1/image.jpg");
            expect(request.getOptions()).toEqual({ original: false, width: 300 });
            expect(request.getContext().url).toBe("/files/file-1/image.jpg");
        });
    });

    describe("ObjectKey", () => {
        it("should extract file id from a bucket key", () => {
            const objectKey = container.resolve(ObjectKey);
            const instance = objectKey.from("tenants/root/files/abc123/image.jpg");

            expect(instance.id()).toBe("abc123");
        });

        it("should extract relative key from a bucket key", () => {
            const objectKey = container.resolve(ObjectKey);
            const instance = objectKey.from("tenants/root/files/abc123/image.jpg");

            expect(instance.relativeKey()).toBe("abc123/image.jpg");
        });
    });

    describe("AssetRequestResolver (FilesAssetRequestResolver)", () => {
        it("should resolve a /files/ request into an AssetRequest", async () => {
            const resolver = container.resolve(AssetRequestResolver);
            const result = await resolver.resolve({
                url: "/files/abc123/image.jpg",
                params: { "*": "/files/abc123/image.jpg" },
                query: { width: "400" },
                headers: {}
            } as AssetRequestResolver.Request);

            expect(result).toBeDefined();
            expect(result!.getKey()).toBe("abc123/image.jpg");
            expect(result!.getOptions().width).toBe(400);
        });

        it("should return undefined for non-/files/ URLs", async () => {
            const resolver = container.resolve(AssetRequestResolver);
            const result = await resolver.resolve({
                url: "/graphql",
                params: { "*": "/graphql" },
                query: {},
                headers: {}
            } as AssetRequestResolver.Request);

            expect(result).toBeUndefined();
        });

        it("should set original=true when query has 'original' key", async () => {
            const resolver = container.resolve(AssetRequestResolver);
            const result = await resolver.resolve({
                url: "/files/abc123/photo.png",
                params: { "*": "/files/abc123/photo.png" },
                query: { original: "" },
                headers: {}
            } as AssetRequestResolver.Request);

            expect(result).toBeDefined();
            expect(result!.getOptions().original).toBe(true);
        });
    });

    describe("AssetResolver (NullAssetResolver)", () => {
        it("should return undefined (no storage backend registered)", async () => {
            const resolver = container.resolve(AssetResolver);
            const request = container.resolve(AssetRequestFactory).create({
                key: "abc123/image.jpg",
                context: { url: "/files/abc123/image.jpg" },
                options: { original: false }
            });

            const result = await resolver.resolve(request);
            expect(result).toBeUndefined();
        });
    });

    describe("AssetOutputStrategy (NullAssetOutputStrategy)", () => {
        it("should return a 404 reply", async () => {
            const strategy = container.resolve(AssetOutputStrategy);
            const asset = Asset.create({
                id: "file-1",
                tenant: "root",
                key: "image.jpg",
                size: 1024,
                contentType: "image/jpeg"
            });

            const reply = await strategy.output(asset);

            expect(reply.getCode()).toBe(404);
            const body = (await reply.getBody()) as { error: string };
            expect(body.error).toBe("Asset output strategy is not implemented!");
        });
    });

    describe("AssetProcessor + PassthroughAssetTransformationStrategy", () => {
        it("should return the asset unchanged when original=true", async () => {
            const processor = container.resolve(AssetProcessor);
            const requestFactory = container.resolve(AssetRequestFactory);

            const request = requestFactory.create({
                key: "abc123/image.jpg",
                context: { url: "/files/abc123/image.jpg" },
                options: { original: true }
            });

            const asset = Asset.create({
                id: "file-1",
                tenant: "root",
                key: "tenants/root/files/file-1/image.jpg",
                size: 4096,
                contentType: "image/png"
            });

            const result = await processor.process(request, asset);
            expect(result).toBe(asset);
        });

        it("should pass through the asset unchanged when original=false (passthrough strategy)", async () => {
            const processor = container.resolve(AssetProcessor);
            const requestFactory = container.resolve(AssetRequestFactory);

            const request = requestFactory.create({
                key: "abc123/image.jpg",
                context: { url: "/files/abc123/image.jpg" },
                options: { original: false }
            });

            const asset = Asset.create({
                id: "file-1",
                tenant: "root",
                key: "tenants/root/files/file-1/image.jpg",
                size: 4096,
                contentType: "image/png"
            });

            const result = await processor.process(request, asset);
            expect(result).toBe(asset);
        });
    });

    describe("StreamAssetReply", () => {
        it("should create a 200 reply with correct content-type and cache headers", async () => {
            const streamReply = container.resolve(StreamAssetReply);
            const asset = Asset.create({
                id: "file-1",
                tenant: "root",
                key: "image.jpg",
                size: 1024,
                contentType: "image/jpeg"
            });

            asset.setContentsReader({
                read: async () => Buffer.from("jpeg-data")
            });

            const reply = streamReply.create(asset);

            expect(reply).toBeInstanceOf(AssetReply);
            expect(reply.getCode()).toBe(200);

            const headers = reply.getHeaders().getHeaders();
            expect(headers["content-type"]).toBe("image/jpeg");
            expect(headers["cache-control"]).toContain("public");
            expect(headers["cache-control"]).toContain("max-age=");
        });
    });

    describe("full pipeline: resolve request → process → output", () => {
        it("should wire the complete asset delivery pipeline via DI", async () => {
            const requestResolver = container.resolve(AssetRequestResolver);
            const assetResolver = container.resolve(AssetResolver);
            const processor = container.resolve(AssetProcessor);
            const outputStrategy = container.resolve(AssetOutputStrategy);

            const request = await requestResolver.resolve({
                url: "/files/abc123/photo.png",
                params: { "*": "/files/abc123/photo.png" },
                query: {},
                headers: {}
            } as AssetRequestResolver.Request);
            expect(request).toBeDefined();

            /* NullAssetResolver returns undefined — in production, S3/local resolver provides the asset. */
            const asset = await assetResolver.resolve(request!);
            expect(asset).toBeUndefined();

            /* Simulate a manually created asset (as if a storage backend provided it). */
            const fallbackAsset = Asset.create({
                id: "missing",
                tenant: "root",
                key: "missing.jpg",
                size: 0,
                contentType: "application/octet-stream"
            });

            const processed = await processor.process(request!, fallbackAsset);
            expect(processed).toBe(fallbackAsset);

            const reply = await outputStrategy.output(processed);
            expect(reply.getCode()).toBe(404);
        });
    });

    describe("private files wiring", () => {
        it("should always register PrivateFileAssetRequestResolver decorator", async () => {
            /* The decorator is registered unconditionally. */
            const resolver = container.resolve(AssetRequestResolver);

            const result = await resolver.resolve({
                url: "/private/abc123/image.jpg",
                params: { "*": "/private/abc123/image.jpg" },
                query: {},
                headers: {}
            } as AssetRequestResolver.Request);

            expect(result).toBeDefined();
            expect(result!.getContext().private).toBe(true);
        });

        it("should not register AssetAuthorizer when WCP private files is disabled", () => {
            expect(() => container.resolve(AssetAuthorizer)).toThrow();
        });
    });
});

describe("AssetDelivery DI integration (private files enabled)", () => {
    let container: Container;

    beforeEach(() => {
        container = new Container();
        container.registerInstance(WcpContext, createMockWcpContext(true));

        container.registerInstance(IdentityContext, {
            getIdentity: () => ({ id: "user-1", displayName: "Test User", type: "admin" }),
            setIdentity: () => undefined,
            withIdentity: async (_identity: any, cb: any) => cb(),
            getPermission: async () => null,
            getPermissions: async () => [],
            listPermissions: async () => [],
            hasFullAccess: async () => true,
            withoutAuthorization: async (cb: any) => cb(),
            isAuthorizationEnabled: () => true
        } as IdentityContext.Interface);

        container.registerInstance(GetFileUseCase, {
            execute: async () => ({
                isFail: () => false,
                value: {
                    id: "file-1",
                    name: "image.jpg",
                    accessControl: { type: "public" }
                }
            })
        } as any);

        AssetDeliveryFeature.register(container);
    });

    it("should resolve AssetAuthorizer when private files are enabled", () => {
        const authorizer = container.resolve(AssetAuthorizer);
        expect(authorizer).toBeDefined();
    });

    it("should resolve AssetRequestResolver with private file decorator", async () => {
        const resolver = container.resolve(AssetRequestResolver);

        const result = await resolver.resolve({
            url: "/private/abc123/image.jpg",
            params: { "*": "/private/abc123/image.jpg" },
            query: {},
            headers: {}
        } as AssetRequestResolver.Request);

        expect(result).toBeDefined();
        expect(result!.getKey()).toBe("abc123/image.jpg");
        expect(result!.getContext().private).toBe(true);
    });

    it("should still resolve /files/ URLs when private files are enabled", async () => {
        const resolver = container.resolve(AssetRequestResolver);

        const result = await resolver.resolve({
            url: "/files/abc123/image.jpg",
            params: { "*": "/files/abc123/image.jpg" },
            query: {},
            headers: {}
        } as AssetRequestResolver.Request);

        expect(result).toBeDefined();
        expect(result!.getKey()).toBe("abc123/image.jpg");
    });
});

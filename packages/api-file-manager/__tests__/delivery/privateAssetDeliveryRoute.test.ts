import { describe, it, expect, beforeEach } from "vitest";
import { Container } from "@webiny/di";
import { HttpRouter, HttpRouterImpl, RequestContainer } from "@webiny/event-handler-core";
import type { IHttpRequest } from "@webiny/event-handler-core";
import { ResponseHeaders } from "@webiny/handler";
import { TenancyFeature } from "@webiny/api-core/features/tenancy/TenancyFeature.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { AnonymousIdentity } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { AuthenticatedIdentity } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { Identity } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type {
    Tenant,
    TenancyStorageOperations as ITenancyStorageOperations
} from "@webiny/api-core/types/tenancy.js";
import { Result } from "@webiny/feature/api";
import { AssetDeliveryRouteDefinition } from "~/delivery/AssetDeliveryRoute.js";
import { PrivateAssetDeliveryRouteDefinition } from "~/delivery/PrivateAssetDeliveryRouteDefinition.js";
import { Asset } from "~/delivery/AssetDelivery/Asset.js";
import { AssetReply } from "~/delivery/AssetDelivery/abstractions/AssetReply.js";
import {
    AssetOutputStrategy,
    AssetProcessor,
    AssetResolver
} from "~/features/assetDelivery/abstractions.js";
import { FilesAssetRequestResolverImpl } from "~/features/assetDelivery/FilesAssetRequestResolver.js";
import { PrivateFileAssetRequestResolverDecorator } from "~/features/assetDelivery/privateFiles/PrivateFileAssetRequestResolver.js";
import { PrivateAuthenticatedAuthorizerImpl } from "~/features/assetDelivery/privateFiles/PrivateAuthenticatedAuthorizer.js";
import { PrivateFilesAssetProcessorDecorator } from "~/features/assetDelivery/privateFiles/PrivateFilesAssetProcessor.js";
import { GetFileUseCase } from "~/features/file/GetFile/index.js";
import { FmPermissions } from "~/features/shared/abstractions.js";
import type { File } from "~/domain/file/types.js";

const FILE_ID = "6abf7a4ba0bdfd0002220a72";
const FILE_KEY = `${FILE_ID}/image.png`;

const createTenant = (id: string): Tenant => {
    return {
        id,
        name: id,
        parent: null,
        isInstalled: true,
        createdOn: new Date().toISOString(),
        description: "",
        settings: {},
        tags: [],
        status: "active",
        savedOn: new Date().toISOString()
    };
};

class MockTenancyStorageOperations implements ITenancyStorageOperations {
    private tenants = new Map<string, Tenant>([["root", createTenant("root")]]);

    async getTenantById(id: string): Promise<Tenant | null> {
        return this.tenants.get(id) || null;
    }

    async getTenantsByIds(ids: readonly string[]): Promise<Tenant[]> {
        return ids.map(id => this.tenants.get(id)!);
    }

    async listTenants(): Promise<Tenant[]> {
        return Array.from(this.tenants.values());
    }

    async createTenant(tenant: Tenant): Promise<Tenant> {
        this.tenants.set(tenant.id, tenant);
        return tenant;
    }

    async updateTenant(tenant: Tenant): Promise<Tenant> {
        this.tenants.set(tenant.id, tenant);
        return tenant;
    }

    async deleteTenant(id: string): Promise<void> {
        this.tenants.delete(id);
    }
}

const createRequest = (path: string): IHttpRequest => {
    return {
        method: "GET",
        path,
        headers: {},
        query: {},
        pathParameters: {},
        body: null
    };
};

const loggedIn = (): Identity => {
    return new AuthenticatedIdentity({ id: "user-1", displayName: "User 1", type: "admin" });
};

describe("AssetDeliveryRoute - private files", () => {
    let router: HttpRouter.Interface;
    let identity: Identity;
    let canReadFiles: boolean;
    let accessControlType: string;
    let resolvedKeys: string[];

    beforeEach(() => {
        identity = loggedIn();
        canReadFiles = true;
        accessControlType = "private-authenticated";
        resolvedKeys = [];

        const container = new Container();
        container.registerInstance(RequestContainer, container);
        TenancyFeature.register(container, new MockTenancyStorageOperations());
        container.resolve(TenantContext).setTenant(createTenant("root"));

        // The caller's identity comes from the request headers, loaded before the route runs.
        container.registerInstance(IdentityContext, {
            getIdentity: () => identity,
            withoutAuthorization: <T>(cb: () => Promise<T>) => cb()
        } as unknown as IdentityContext.Interface);
        container.registerInstance(FmPermissions, {
            canRead: async (entity: string) => entity === "file" && canReadFiles
        } as unknown as FmPermissions.Interface);
        container.registerInstance(GetFileUseCase, {
            execute: async () => {
                const file = {
                    id: FILE_ID,
                    key: FILE_KEY,
                    accessControl: { type: accessControlType }
                } as unknown as File;
                return Result.ok(file);
            }
        } as unknown as GetFileUseCase.Interface);

        container.register(FilesAssetRequestResolverImpl);
        container.registerDecorator(PrivateFileAssetRequestResolverDecorator);

        container.registerInstance(AssetResolver, {
            resolve: async request => {
                resolvedKeys.push(request.getKey());
                return new Asset({
                    id: FILE_ID,
                    tenant: "root",
                    key: `tenants/root/files/${FILE_KEY}`,
                    size: 5,
                    contentType: "image/png"
                });
            }
        });
        container.registerInstance(AssetProcessor, {
            process: async (_, asset) => asset
        });
        container.register(PrivateAuthenticatedAuthorizerImpl);
        container.registerDecorator(PrivateFilesAssetProcessorDecorator);

        container.registerInstance(AssetOutputStrategy, {
            output: async () => {
                return new AssetReply({
                    code: 200,
                    headers: ResponseHeaders.create({
                        "content-type": "image/png",
                        "cache-control": "max-age=60"
                    }),
                    body: () => Buffer.from("image")
                });
            }
        });

        container.register(AssetDeliveryRouteDefinition);
        container.register(PrivateAssetDeliveryRouteDefinition);
        container.register(HttpRouterImpl);
        router = container.resolve(HttpRouter);
    });

    it("serves a private file from /private/* to a caller with File Manager read access", async () => {
        const response = await router.route(createRequest(`/private/${FILE_KEY}`));

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(Buffer.from("image"));
        expect(resolvedKeys).toEqual([FILE_KEY]);

        const cacheControl = response.headers?.["cache-control"] ?? "";
        expect(cacheControl).toContain("private");
        expect(cacheControl).not.toContain("public");
    });

    it("refuses an anonymous caller", async () => {
        identity = new AnonymousIdentity();

        const response = await router.route(createRequest(`/private/${FILE_KEY}`));

        expect(response.statusCode).toBe(403);
        expect(response.headers?.["cache-control"]).toBe("no-store");
    });

    it("refuses a caller without File Manager read access", async () => {
        canReadFiles = false;

        const response = await router.route(createRequest(`/private/${FILE_KEY}`));

        expect(response.statusCode).toBe(403);
    });

    it("redirects a private file requested via /files/* to /private/*", async () => {
        const response = await router.route(createRequest(`/files/${FILE_KEY}`));

        expect(response.statusCode).toBe(301);
        expect(response.headers?.["location"]).toBe(`/private/${FILE_KEY}`);
    });

    it("redirects a public file requested via /private/* to /files/*", async () => {
        accessControlType = "public";

        const response = await router.route(createRequest(`/private/${FILE_KEY}`));

        expect(response.statusCode).toBe(301);
        expect(response.headers?.["location"]).toBe(`/files/${FILE_KEY}`);
    });

    it("does not match a sibling of /private", async () => {
        await expect(router.route(createRequest(`/privateX/${FILE_KEY}`))).rejects.toMatchObject({
            code: "ROUTE_NOT_FOUND"
        });
    });
});

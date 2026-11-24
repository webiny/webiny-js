import { describe, it, expect, beforeEach } from "vitest";
import { Container } from "@webiny/di";
import { HttpRouter } from "@webiny/kernel-core";
import { HttpRouterImpl } from "@webiny/kernel-core";
import { RequestContainer } from "@webiny/kernel-core";
import type { IHttpRequest } from "@webiny/kernel-core";
import { TenancyFeature } from "@webiny/api-core/features/tenancy/TenancyFeature.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import type { TenancyStorageOperations as ITenancyStorageOperations } from "@webiny/api-core/types/tenancy.js";
import { AssetDeliveryRouteDefinition } from "~/delivery/AssetDeliveryRoute.js";
import { PrivateAssetDeliveryRouteDefinition } from "~/features/assetDelivery/privateFiles/PrivateAssetDeliveryRouteDefinition.js";
import { Asset } from "~/delivery/AssetDelivery/Asset.js";
import type { AssetRequest } from "~/delivery/AssetDelivery/AssetRequest.js";
import { AssetReply } from "~/delivery/AssetDelivery/abstractions/AssetReply.js";
import { AssetOutputStrategy } from "~/features/assetDelivery/abstractions.js";
import { AssetProcessor } from "~/features/assetDelivery/abstractions.js";
import { AssetResolver } from "~/features/assetDelivery/abstractions.js";
import { FilesAssetRequestResolverImpl } from "~/features/assetDelivery/FilesAssetRequestResolver.js";
import { PrivateFileAssetRequestResolverDecorator } from "~/features/assetDelivery/privateFiles/PrivateFileAssetRequestResolver.js";

const FILE_KEY = "6abf7a4ba0bdfd0002220a72/image.png";

const root: Tenant = {
    id: "root",
    name: "root",
    parent: null,
    isInstalled: true,
    createdOn: new Date().toISOString(),
    description: "",
    settings: {},
    tags: [],
    status: "active",
    savedOn: new Date().toISOString()
};

class MockTenancyStorageOperations implements ITenancyStorageOperations {
    async getTenantById(id: string): Promise<Tenant | null> {
        return id === "root" ? root : null;
    }

    async getTenantsByIds(): Promise<Tenant[]> {
        return [root];
    }

    async listTenants(): Promise<Tenant[]> {
        return [root];
    }

    async createTenant(tenant: Tenant): Promise<Tenant> {
        return tenant;
    }

    async updateTenant(tenant: Tenant): Promise<Tenant> {
        return tenant;
    }

    async deleteTenant(): Promise<void> {}
}

const get = (path: string, query: Record<string, string> = {}): IHttpRequest => {
    return { method: "GET", path, headers: {}, query, pathParameters: {}, body: null };
};

describe("AssetDeliveryRoute - routing", () => {
    let router: HttpRouter.Interface;
    let resolvedRequests: AssetRequest[];

    beforeEach(() => {
        const container = new Container();
        container.registerInstance(RequestContainer, container);
        const tenancyStorageOperations = new MockTenancyStorageOperations();
        TenancyFeature.register(container, tenancyStorageOperations);
        container.resolve(TenantContext).setTenant(root);

        container.register(AssetDeliveryRouteDefinition);
        container.register(PrivateAssetDeliveryRouteDefinition);
        container.register(HttpRouterImpl);

        // The real request resolvers, as AssetDeliveryFeature registers them.
        container.register(FilesAssetRequestResolverImpl);
        container.registerDecorator(PrivateFileAssetRequestResolverDecorator);

        resolvedRequests = [];
        container.registerInstance(AssetResolver, {
            resolve: async (assetRequest: AssetRequest) => {
                resolvedRequests.push(assetRequest);
                return new Asset({
                    id: "6abf7a4ba0bdfd0002220a72",
                    tenant: "root",
                    key: assetRequest.getKey(),
                    size: 5,
                    contentType: "image/png"
                });
            }
        });
        container.registerInstance(AssetProcessor, { process: async (_, asset) => asset });
        container.registerInstance(AssetOutputStrategy, {
            output: async () => new AssetReply({ code: 200, body: () => Buffer.from("image") })
        });

        router = container.resolve(HttpRouter);
    });

    it("delivers a public file from /files/*", async () => {
        const request = get(`/files/${FILE_KEY}`);
        const response = await router.route(request);
        const keys = resolvedRequests.map(r => r.getKey());
        const context = resolvedRequests[0].getContext();

        expect(response.statusCode).toBe(200);
        expect(keys).toEqual([FILE_KEY]);
        expect(context.private).toBeUndefined();
    });

    it("delivers a private file from /private/*", async () => {
        const request = get(`/private/${FILE_KEY}`);
        const response = await router.route(request);
        const keys = resolvedRequests.map(r => r.getKey());
        const context = resolvedRequests[0].getContext();

        expect(response.statusCode).toBe(200);
        expect(keys).toEqual([FILE_KEY]);
        expect(context).toEqual({
            url: `/private/${FILE_KEY}`,
            private: true
        });
    });

    // The redirects between /files/ and /private/ are built from this URL.
    it("keeps the query string in the request URL", async () => {
        const request = get(`/files/${FILE_KEY}`, { width: "640" });
        await router.route(request);
        const context = resolvedRequests[0].getContext();
        const options = resolvedRequests[0].getOptions();

        expect(context.url).toBe(`/files/${FILE_KEY}?width=640`);
        expect(options.width).toBe(640);
    });

    // A bare `?original` parses to "", and the redirect from /files/ turns it into `?original=`.
    it("treats a bare ?original on /private/* as set", async () => {
        const request = get(`/private/${FILE_KEY}`, { original: "" });
        await router.route(request);
        const options = resolvedRequests[0].getOptions();

        expect(options.original).toBe(true);
    });
});

import { describe, it, expect, beforeEach } from "vitest";
import { Container } from "@webiny/di";
import { RequestContainer, invokeHttpRoute } from "@webiny/event-handler-core";
import type { HttpRouteHandler, IHttpRequest } from "@webiny/event-handler-core";
import { TenancyFeature } from "@webiny/api-core/features/tenancy/TenancyFeature.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import type {
    Tenant,
    TenancyStorageOperations as ITenancyStorageOperations
} from "@webiny/api-core/types/tenancy.js";
import { AssetDeliveryRoute } from "~/delivery/AssetDeliveryRoute.js";
import { Asset } from "~/delivery/AssetDelivery/Asset.js";
import { AssetRequest } from "~/delivery/AssetDelivery/AssetRequest.js";
import { AssetReply } from "~/delivery/AssetDelivery/abstractions/AssetReply.js";
import {
    AssetOutputStrategy,
    AssetProcessor,
    AssetRequestResolver,
    AssetResolver
} from "~/features/assetDelivery/abstractions.js";

const FILE_ID = "6abf7a4ba0bdfd0002220a72";

const createTenant = (id: string, parent: string | null): Tenant => {
    return {
        id,
        name: id,
        parent,
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
    private tenants = new Map<string, Tenant>([
        ["root", createTenant("root", null)],
        ["sub", createTenant("sub", "root")]
    ]);

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

const request: IHttpRequest = {
    method: "GET",
    path: `/files/${FILE_ID}/image.png`,
    headers: {},
    query: { original: "" },
    pathParameters: {},
    body: null
};

describe("AssetDeliveryRoute - tenancy", () => {
    let tenantContext: TenantContext.Interface;
    let route: HttpRouteHandler.Interface;
    let assetTenant: string;
    let processorError: Error | undefined;
    let tenantsSeenByProcessor: string[];
    let tenantsSeenByOutput: string[];

    beforeEach(() => {
        const container = new Container();
        container.registerInstance(RequestContainer, container);
        TenancyFeature.register(container, new MockTenancyStorageOperations());

        tenantContext = container.resolve(TenantContext);
        // Asset delivery requests carry no tenant header, so they run in the root tenant.
        tenantContext.setTenant(createTenant("root", null));

        assetTenant = "sub";
        processorError = undefined;
        tenantsSeenByProcessor = [];
        tenantsSeenByOutput = [];

        container.registerInstance(AssetRequestResolver, {
            resolve: async () => {
                return new AssetRequest({
                    key: `${FILE_ID}/image.png`,
                    context: { url: request.path },
                    options: { original: true }
                });
            }
        });

        // Mirrors the S3 resolver: metadata comes from the global KV store and names the tenant.
        container.registerInstance(AssetResolver, {
            resolve: async () => {
                return new Asset({
                    id: FILE_ID,
                    tenant: assetTenant,
                    key: `tenants/${assetTenant}/files/${FILE_ID}/image.png`,
                    size: 5,
                    contentType: "image/png"
                });
            }
        });

        container.registerInstance(AssetProcessor, {
            process: async (_, asset) => {
                tenantsSeenByProcessor.push(tenantContext.getTenant().id);
                if (processorError) {
                    throw processorError;
                }
                return asset;
            }
        });

        container.registerInstance(AssetOutputStrategy, {
            output: async () => {
                tenantsSeenByOutput.push(tenantContext.getTenant().id);
                return new AssetReply({ code: 200, body: () => Buffer.from("image") });
            }
        });

        route = container.resolveImplementation(AssetDeliveryRoute);
    });

    it("processes and outputs the asset in the tenant that owns it", async () => {
        const response = await invokeHttpRoute(route, request);

        expect(response.statusCode).toBe(200);
        expect(tenantsSeenByProcessor).toEqual(["sub"]);
        expect(tenantsSeenByOutput).toEqual(["sub"]);
        expect(tenantContext.getTenant().id).toBe("root");
    });

    it("returns 404 when the asset's tenant does not exist", async () => {
        assetTenant = "ghost";

        const response = await invokeHttpRoute(route, request);

        expect(response.statusCode).toBe(404);
        expect(tenantsSeenByProcessor).toEqual([]);
        expect(tenantContext.getTenant().id).toBe("root");
    });

    it("restores the request tenant when processing fails", async () => {
        processorError = new Error("Boom!");

        await expect(invokeHttpRoute(route, request)).rejects.toThrow("Boom!");

        expect(tenantsSeenByProcessor).toEqual(["sub"]);
        expect(tenantContext.getTenant().id).toBe("root");
    });
});

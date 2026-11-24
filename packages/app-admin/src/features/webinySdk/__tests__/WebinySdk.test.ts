import { afterEach, describe, expect, it, vi } from "vitest";
import { Container } from "@webiny/di";
import { EnvConfig } from "@webiny/app/features/envConfig";
import { ApiRequestHeadersResolver } from "@webiny/app/features/apiRequestHeaders/abstractions.js";
import { AuthenticationContext } from "~/features/security/AuthenticationContext/index.js";
import { TenantContext } from "~/features/tenancy/abstractions.js";
import { WebinySdk as Abstraction } from "../abstractions.js";
import { WebinySdk } from "../WebinySdk.js";

const createSdk = (providerHeaders: Record<string, string | number | undefined>) => {
    let tenant = "root";
    const container = new Container();
    container.registerInstance(AuthenticationContext, {
        getIdToken: async () => "id-token"
    } as unknown as AuthenticationContext.Interface);
    container.registerInstance(EnvConfig, {
        get: () => "https://api.example.com"
    } as unknown as EnvConfig.Interface);
    container.registerInstance(TenantContext, {
        getCurrentTenant: () => tenant
    } as unknown as TenantContext.Interface);
    container.registerInstance(ApiRequestHeadersResolver, {
        resolve: async () => providerHeaders
    });
    container.register(WebinySdk).inSingletonScope();
    return {
        sdk: container.resolve(Abstraction),
        setTenant: (value: string) => {
            tenant = value;
        }
    };
};

const mockFetch = () => {
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => {
        return new Response(
            JSON.stringify({
                data: { websiteBuilder: { listGlobalComponents: { data: [], error: null } } }
            }),
            { status: 200 }
        );
    });
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
};

const sentHeaders = (fetchMock: ReturnType<typeof mockFetch>, call = 0) => {
    return fetchMock.mock.calls[call][1].headers as Record<string, string>;
};

describe("WebinySdk (admin)", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("sends the extensions' API request headers", async () => {
        const fetchMock = mockFetch();
        const { sdk } = createSdk({ "x-pac-airline": "t5t", "x-empty": undefined });

        await sdk.websiteBuilder.listGlobalComponents();

        const headers = sentHeaders(fetchMock);
        expect(headers["x-pac-airline"]).toBe("t5t");
        expect(headers).not.toHaveProperty("x-empty");
        expect(headers.Authorization).toBe("Bearer id-token");
    });

    it("never lets a provider replace the tenant or the auth header", async () => {
        const fetchMock = mockFetch();
        const { sdk } = createSdk({ "X-Tenant": "other", authorization: "Bearer stolen" });

        await sdk.websiteBuilder.listGlobalComponents();

        const headers = sentHeaders(fetchMock);
        expect(headers["x-tenant"]).toBe("root");
        expect(headers).not.toHaveProperty("X-Tenant");
        expect(headers).not.toHaveProperty("authorization");
        expect(headers.Authorization).toBe("Bearer id-token");
    });

    it("reads the current tenant on each request", async () => {
        const fetchMock = mockFetch();
        const { sdk, setTenant } = createSdk({});

        await sdk.websiteBuilder.listGlobalComponents();
        setTenant("acme");
        await sdk.websiteBuilder.listGlobalComponents();

        expect(sentHeaders(fetchMock, 0)["x-tenant"]).toBe("root");
        expect(sentHeaders(fetchMock, 1)["x-tenant"]).toBe("acme");
    });
});

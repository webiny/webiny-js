import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { AuthenticationContext } from "@webiny/api-core/features/security/authentication/AuthenticationContext/index.js";
import { InvalidTokenError } from "@webiny/api-core/features/security/authentication/AuthenticationContext/index.js";
import { AnonymousIdentity } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { AuthenticatedIdentity } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { Identity } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { CanAccessCurrentTenantUseCase } from "@webiny/api-core/features/security/CanAccessCurrentTenant/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { GetTenantByIdUseCase } from "@webiny/api-core/features/tenancy/GetTenantById/index.js";
import { RequestContextFeature } from "@webiny/api-core/features/requestContext/index.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { createWebsocketsAuthenticator } from "~/websockets/createWebsocketsAuthenticator.js";
import { createMockLogger } from "./createMockLogger.js";

// The request stack is what supplies these services; here the root container does.
vi.mock("@webiny/api-event-handler-core", () => ({
    registerApiRequestStack: vi.fn().mockResolvedValue(undefined)
}));

// No extensions: the mocked request stack never reads them.
const extensions = () => [];

const user = new AuthenticatedIdentity({ id: "user-1", displayName: "User One", type: "admin" });

const getTenantById = async (id: string) => {
    if (id === "root" || id === "acme") {
        return Result.ok({ id, status: "enabled" } as Tenant);
    }
    return Result.fail({ type: "NOT_FOUND" as const });
};

describe("createWebsocketsAuthenticator", () => {
    let authenticate: Mock<AuthenticationContext.Interface["authenticate"]>;
    let canAccessTenant: Mock<CanAccessCurrentTenantUseCase.Interface["execute"]>;
    let currentTenant: Tenant | null;
    let currentIdentity: Identity;
    let logger: Logger.Interface;
    let container: Container;

    beforeEach(() => {
        authenticate = vi.fn<AuthenticationContext.Interface["authenticate"]>();
        canAccessTenant = vi
            .fn<CanAccessCurrentTenantUseCase.Interface["execute"]>()
            .mockResolvedValue(true);
        currentTenant = null;
        currentIdentity = new AnonymousIdentity();
        logger = createMockLogger();

        container = new Container();
        RequestContextFeature.register(container);
        container.registerInstance(AuthenticationContext, {
            authenticate,
            getAuthToken: () => undefined
        });
        container.registerInstance(CanAccessCurrentTenantUseCase, { execute: canAccessTenant });
        container.registerInstance(GetTenantByIdUseCase, { execute: getTenantById });
        container.registerInstance(TenantContext, {
            getTenant: () => currentTenant,
            setTenant: (tenant: Tenant) => {
                currentTenant = tenant;
            }
        } as unknown as TenantContext.Interface);
        container.registerInstance(IdentityContext, {
            getIdentity: () => currentIdentity,
            setIdentity: (identity: Identity) => {
                currentIdentity = identity;
            }
        } as unknown as IdentityContext.Interface);
        container.registerInstance(Logger, logger);
    });

    it("returns the identity a token authenticates as", async () => {
        authenticate.mockResolvedValue(user);
        const authenticator = createWebsocketsAuthenticator(container, extensions);

        const result = await authenticator("valid", "root");

        expect(result).toEqual({ id: "user-1", displayName: "User One", type: "admin" });
    });

    // No authenticator recognises the token, so it comes back as the anonymous identity, which has
    // no access to any tenant.
    it("refuses a token that resolves to the anonymous identity", async () => {
        authenticate.mockResolvedValue(new AnonymousIdentity());
        canAccessTenant.mockResolvedValue(false);
        const authenticator = createWebsocketsAuthenticator(container, extensions);

        const result = await authenticator("not-a-jwt", "root");

        expect(result).toBeNull();
    });

    it("refuses a token authentication rejects, and logs why", async () => {
        authenticate.mockRejectedValue(new InvalidTokenError("jwt expired"));
        const authenticator = createWebsocketsAuthenticator(container, extensions);

        const result = await authenticator("expired", "root");

        expect(result).toBeNull();
        expect(logger.warn).toHaveBeenCalledTimes(1);
    });

    it("throws any other error, so the server answers 500", async () => {
        authenticate.mockRejectedValue(new Error("container misconfigured"));
        const authenticator = createWebsocketsAuthenticator(container, extensions);

        const result = authenticator("valid", "root");

        await expect(result).rejects.toThrow("container misconfigured");
    });

    it("sets the requested tenant before it authenticates the token", async () => {
        let tenantWhenAuthenticating: string | null = "not called";
        authenticate.mockImplementation(async () => {
            // An API key is looked up in the current tenant.
            tenantWhenAuthenticating = currentTenant?.id ?? null;
            return user;
        });
        const authenticator = createWebsocketsAuthenticator(container, extensions);

        await authenticator("wat_123", "acme");

        expect(tenantWhenAuthenticating).toBe("acme");
    });

    it("refuses a tenant that does not exist", async () => {
        const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const authenticator = createWebsocketsAuthenticator(container, extensions);

        const result = await authenticator("valid", "nope");

        expect(result).toBeNull();
        expect(authenticate).not.toHaveBeenCalled();
        consoleWarn.mockRestore();
    });

    // A user of one tenant naming another: the token is valid, but there is no access there.
    it("refuses an identity that cannot access the tenant", async () => {
        authenticate.mockResolvedValue(user);
        canAccessTenant.mockResolvedValue(false);
        const authenticator = createWebsocketsAuthenticator(container, extensions);

        const result = await authenticator("valid", "acme");

        expect(result).toBeNull();
    });
});

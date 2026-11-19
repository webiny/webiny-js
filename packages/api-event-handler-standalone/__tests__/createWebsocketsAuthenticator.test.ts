import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import { Container } from "@webiny/di";
import { AuthenticationContext } from "@webiny/api-core/features/security/authentication/AuthenticationContext/index.js";
import { InvalidTokenError } from "@webiny/api-core/features/security/authentication/AuthenticationContext/index.js";
import { AnonymousIdentity } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { AuthenticatedIdentity } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { AuthorizationContext } from "@webiny/api-core/features/security/authorization/AuthorizationContext/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { GetTenantByIdUseCase } from "@webiny/api-core/features/tenancy/GetTenantById/index.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import { Result } from "@webiny/feature/api";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { createWebsocketsAuthenticator } from "~/websockets/createWebsocketsAuthenticator.js";
import { createMockLogger } from "./createMockLogger.js";

// The request stack is what supplies AuthenticationContext; here the root container does.
vi.mock("@webiny/api-event-handler-core", () => ({
    registerApiRequestStack: vi.fn().mockResolvedValue(undefined)
}));

// No extensions: the mocked request stack never reads them.
const extensions = () => [];

describe("createWebsocketsAuthenticator", () => {
    let authenticate: Mock<AuthenticationContext.Interface["authenticate"]>;
    let loadPermissions: Mock<AuthorizationContext.Interface["loadPermissions"]>;
    let currentTenant: string | null;
    let logger: Logger.Interface;
    let container: Container;

    beforeEach(() => {
        authenticate = vi.fn<AuthenticationContext.Interface["authenticate"]>();
        loadPermissions = vi
            .fn<AuthorizationContext.Interface["loadPermissions"]>()
            .mockResolvedValue([{ name: "*" }]);
        currentTenant = null;
        logger = createMockLogger();
        container = new Container();
        const authentication: AuthenticationContext.Interface = {
            authenticate,
            getAuthToken: () => undefined
        };
        container.registerInstance(AuthenticationContext, authentication);
        container.registerInstance(AuthorizationContext, {
            loadPermissions
        } as unknown as AuthorizationContext.Interface);
        container.registerInstance(TenantContext, {
            setTenant: (tenant: Tenant) => {
                currentTenant = tenant.id;
            }
        } as unknown as TenantContext.Interface);
        container.registerInstance(GetTenantByIdUseCase, {
            execute: async (id: string) =>
                id === "root" || id === "acme"
                    ? Result.ok({ id } as Tenant)
                    : Result.fail({ type: "NOT_FOUND" })
        } as unknown as GetTenantByIdUseCase.Interface);
        container.registerInstance(Logger, logger);
    });

    it("returns the identity a token authenticates as", async () => {
        const identity = new AuthenticatedIdentity({
            id: "user-1",
            displayName: "User One",
            type: "admin"
        });
        authenticate.mockResolvedValue(identity);
        const authenticator = createWebsocketsAuthenticator(container, extensions);

        const result = await authenticator("valid", "root");

        expect(result).toEqual({ id: "user-1", displayName: "User One", type: "admin" });
    });

    // No authenticator recognises the token, so it comes back as the anonymous identity, not an error.
    it("refuses a token that resolves to the anonymous identity", async () => {
        authenticate.mockResolvedValue(new AnonymousIdentity());
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
            tenantWhenAuthenticating = currentTenant;
            return new AuthenticatedIdentity({ id: "key-1", displayName: "Key", type: "api-key" });
        });
        const authenticator = createWebsocketsAuthenticator(container, extensions);

        await authenticator("wat_123", "acme");

        expect(tenantWhenAuthenticating).toBe("acme");
    });

    it("refuses a tenant that does not exist", async () => {
        const authenticator = createWebsocketsAuthenticator(container, extensions);

        const result = await authenticator("valid", "nope");

        expect(result).toBeNull();
        expect(authenticate).not.toHaveBeenCalled();
    });

    // A user of one tenant naming another: the token is valid, but there are no permissions there.
    it("refuses an identity with no permissions in the tenant", async () => {
        authenticate.mockResolvedValue(
            new AuthenticatedIdentity({ id: "user-1", displayName: "User One", type: "admin" })
        );
        loadPermissions.mockResolvedValue([]);
        const authenticator = createWebsocketsAuthenticator(container, extensions);

        const result = await authenticator("valid", "acme");

        expect(result).toBeNull();
    });
});

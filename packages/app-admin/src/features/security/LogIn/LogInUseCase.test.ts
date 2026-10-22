import { describe, it, expect, vi, beforeEach } from "vitest";
import { Container } from "@webiny/di";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import { LocalStorage } from "@webiny/app/features/localStorage/index.js";
import { LogInFeature } from "./feature.js";
import { AuthenticationContextFeature } from "~/features/security/AuthenticationContext/feature.js";
import { IdentityContextFeature } from "~/features/security/IdentityContext/feature.js";
import { TenancyFeature } from "~/features/tenancy/feature.js";

const createLocalStorage = (initial: Record<string, any> = {}): LocalStorage.Interface => {
    const values = new Map<string, any>(Object.entries(initial));
    return {
        get: key => values.get(key),
        set: (key, value) => {
            values.set(key, value);
        },
        remove: key => {
            values.delete(key);
        },
        clear: () => values.clear(),
        keys: () => Array.from(values.keys())
    };
};

const identityDto = {
    id: "user-1",
    type: "admin",
    displayName: "User 1",
    roles: [],
    teams: [],
    permissions: [{ name: "*" }],
    profile: { firstName: "", lastName: "", email: "user-1@webiny.local" },
    currentTenant: { id: "acme", name: "Acme" },
    defaultTenant: { id: "root", name: "Root" }
};

const loginResponse = (login: { data?: any; error?: any }) => {
    return { security: { login: { data: login.data ?? null, error: login.error ?? null } } };
};

const tenantSelectionRequired = (tenants: { id: string; name: string }[]) => {
    return loginResponse({
        error: {
            code: "Security/Identity/TenantSelectionRequired",
            message: "Your user account belongs to a different tenant.",
            data: { tenants }
        }
    });
};

describe("LogIn feature: tenant resolution", () => {
    let container: Container;
    let execute: ReturnType<typeof vi.fn>;
    let storage: LocalStorage.Interface;

    const setup = (storedTenant?: string) => {
        container = new Container();
        storage = createLocalStorage(storedTenant ? { tenantId: storedTenant } : {});
        execute = vi.fn();

        container.registerInstance(LocalStorage, storage);
        container.registerInstance(MainGraphQLClient, {
            execute
        } as unknown as MainGraphQLClient.Interface);

        TenancyFeature.register(container);
        AuthenticationContextFeature.register(container);
        IdentityContextFeature.register(container);
        LogInFeature.register(container);
    };

    const login = () => {
        const { useCase } = LogInFeature.resolve(container);
        return useCase.execute({ idTokenProvider: async () => "token" });
    };

    const currentTenant = () => TenancyFeature.resolve(container).service.getCurrentTenant();

    beforeEach(() => {
        setup();
    });

    it("logs in on the current tenant when the user has access to it", async () => {
        setup("acme");
        execute.mockResolvedValue(loginResponse({ data: identityDto }));

        const result = await login();

        expect(result).toEqual({ type: "loggedIn" });
        expect(currentTenant()).toBe("acme");
        expect(execute).toHaveBeenCalledTimes(1);
    });

    it("switches to the only tenant the user can access, and remembers it", async () => {
        const onChange = vi.fn();
        TenancyFeature.resolve(container).service.onTenantChange(onChange);
        execute.mockResolvedValue(tenantSelectionRequired([{ id: "acme", name: "Acme" }]));

        const result = await login();

        expect(result).toEqual({ type: "switchingTenant", tenantId: "acme" });
        expect(currentTenant()).toBe("acme");
        expect(storage.get("tenantId")).toBe("acme");
        // The tenancy provider reloads the app on this change.
        expect(onChange).toHaveBeenCalledWith("acme");
    });

    it("asks the user to pick when they can access several tenants", async () => {
        const tenants = [
            { id: "acme", name: "Acme" },
            { id: "beta", name: "Beta" }
        ];
        execute.mockResolvedValue(tenantSelectionRequired(tenants));

        const result = await login();

        expect(result).toEqual({ type: "selectTenant", tenants });
        expect(currentTenant()).toBe("root");
    });

    it("reports no access when the user has no tenant", async () => {
        execute.mockResolvedValue(tenantSelectionRequired([]));
        expect(await login()).toEqual({ type: "noTenantAccess" });

        execute.mockResolvedValue(
            loginResponse({
                error: { code: "Security/Identity/NotAuthorized", message: "Missing user profile!" }
            })
        );
        expect(await login()).toEqual({ type: "noTenantAccess" });
        expect(currentTenant()).toBe("root");
    });

    it("sends a user from a `?tenantId` they can't access to their own tenant", async () => {
        // The tenancy provider has already stored the `?tenantId` tenant.
        setup("beta");
        execute.mockResolvedValue(tenantSelectionRequired([{ id: "acme", name: "Acme" }]));

        const result = await login();

        expect(result).toEqual({ type: "switchingTenant", tenantId: "acme" });
        expect(currentTenant()).toBe("acme");
    });

    it("throws instead of switching to the tenant it's already on", async () => {
        setup("acme");
        const onChange = vi.fn();
        TenancyFeature.resolve(container).service.onTenantChange(onChange);
        execute.mockResolvedValue(tenantSelectionRequired([{ id: "acme", name: "Acme" }]));

        await expect(login()).rejects.toMatchObject({
            code: "Security/Identity/TenantSelectionRequired"
        });
        expect(onChange).not.toHaveBeenCalled();
    });

    it.each([
        ["deleted", { message: "Unable to load tenant!", code: "Tenancy/TenantNotFound" }],
        ["disabled", { message: "Tenant is disabled!", code: "Tenancy/TenantDisabled" }]
    ])("retries through root when the stored tenant is %s", async (_, requestError) => {
        setup("old-tenant");
        execute.mockRejectedValue(requestError);

        const result = await login();

        expect(result).toEqual({ type: "switchingTenant", tenantId: "root" });
        expect(currentTenant()).toBe("root");
    });

    it("doesn't loop when root itself can't be loaded", async () => {
        setup("root");
        execute.mockRejectedValue({
            message: "Tenant is disabled!",
            code: "Tenancy/TenantDisabled"
        });

        await expect(login()).rejects.toMatchObject({ code: "Tenancy/TenantDisabled" });
        expect(currentTenant()).toBe("root");
    });

    it("throws errors that aren't about the tenant, with their message", async () => {
        execute.mockResolvedValue(
            loginResponse({ error: { code: "SOMETHING", message: "Something broke." } })
        );

        await expect(login()).rejects.toMatchObject({
            code: "SOMETHING",
            message: "Something broke."
        });
    });

    it("throws when the user has no permissions on the tenant", async () => {
        execute.mockResolvedValue(loginResponse({ data: { ...identityDto, permissions: [] } }));

        await expect(login()).rejects.toThrow("You have no permissions on this tenant!");
    });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Container } from "@webiny/di";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import { LocalStorage } from "@webiny/app/features/localStorage/index.js";
import { TenancyFeature } from "@webiny/app-admin/features/tenancy/feature.js";
import { SecurityFeature } from "@webiny/app-admin/features/security/SecurityFeature.js";
import { CognitoFeature } from "./feature.js";

const amplify = vi.hoisted(() => {
    return {
        signIn: vi.fn(),
        signOut: vi.fn(),
        fetchAuthSession: vi.fn()
    };
});

vi.mock("aws-amplify", () => ({ Amplify: { configure: vi.fn() } }));

vi.mock("aws-amplify/auth", () => ({
    signIn: amplify.signIn,
    signOut: amplify.signOut,
    fetchAuthSession: amplify.fetchAuthSession,
    confirmSignIn: vi.fn(),
    resetPassword: vi.fn(),
    confirmResetPassword: vi.fn()
}));

const createLocalStorage = (): LocalStorage.Interface => {
    const values = new Map<string, any>();
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

const loginResponse = (login: { data?: any; error?: any }) => {
    return { security: { login: { data: login.data ?? null, error: login.error ?? null } } };
};

const tenantSelection = (tenants: { id: string; name: string }[]) => {
    return loginResponse({ data: { __typename: "SecurityLoginTenantSelection", tenants } });
};

const identityDto = {
    __typename: "SecurityIdentity",
    id: "user-1",
    type: "admin",
    displayName: "User 1",
    roles: [],
    teams: [],
    permissions: [{ name: "*" }],
    profile: { firstName: "", lastName: "", email: "user-1@webiny.local" },
    currentTenant: { id: "root", name: "Root" },
    defaultTenant: { id: "root", name: "Root" }
};

describe("CognitoPresenter: signing in to a tenant", () => {
    let container: Container;
    let execute: ReturnType<typeof vi.fn>;

    const presenter = () => CognitoFeature.resolve(container).presenter;
    const currentTenant = () => TenancyFeature.resolve(container).service.getCurrentTenant();

    beforeEach(() => {
        vi.clearAllMocks();
        amplify.signIn.mockResolvedValue({ nextStep: { signInStep: "DONE" } });
        amplify.signOut.mockResolvedValue(undefined);
        amplify.fetchAuthSession.mockResolvedValue({ tokens: { idToken: "token" } });

        container = new Container();
        execute = vi.fn();
        container.registerInstance(LocalStorage, createLocalStorage());
        container.registerInstance(MainGraphQLClient, {
            execute
        } as unknown as MainGraphQLClient.Interface);

        TenancyFeature.register(container);
        SecurityFeature.register(container);
        CognitoFeature.register(container);
    });

    it("signs the user in when they can access the current tenant", async () => {
        execute.mockResolvedValue(loginResponse({ data: identityDto }));

        await presenter().signIn("user-1@webiny.local", "password");

        expect(presenter().vm.authState).toBe("signedIn");
        expect(presenter().vm.isAuthenticated).toBe(true);
    });

    it("keeps the loader on while the app reloads on the user's only tenant", async () => {
        execute.mockResolvedValue(tenantSelection([{ id: "acme", name: "Acme" }]));

        await presenter().signIn("user-1@webiny.local", "password");

        expect(presenter().vm.isLoggingIn).toBe(true);
        expect(currentTenant()).toBe("acme");
        expect(amplify.signOut).not.toHaveBeenCalled();
    });

    it("shows a tenant picker when the user can access several tenants, and picking one opens it", async () => {
        const tenants = [
            { id: "acme", name: "Acme" },
            { id: "beta", name: "Beta" }
        ];
        execute.mockResolvedValue(tenantSelection(tenants));

        await presenter().signIn("user-1@webiny.local", "password");

        expect(presenter().vm.authState).toBe("selectTenant");
        expect(presenter().vm.isLoggingIn).toBe(false);
        expect(presenter().vm.selectTenant.tenants).toEqual(tenants);

        presenter().selectTenant("beta");

        expect(currentTenant()).toBe("beta");
        expect(presenter().vm.isLoggingIn).toBe(true);
    });

    it("shows the no-access screen, and signing out returns to the sign-in form", async () => {
        execute.mockResolvedValue(
            loginResponse({
                error: { code: "Security/Identity/NotAuthorized", message: "Missing user profile!" }
            })
        );

        await presenter().signIn("user-1@webiny.local", "password");

        expect(presenter().vm.authState).toBe("noTenantAccess");

        await presenter().signOut();

        expect(amplify.signOut).toHaveBeenCalled();
        expect(presenter().vm.authState).toBe("signIn");
        expect(presenter().vm.signIn.message).toBeNull();
    });

    it("shows any other login error on the sign-in form instead of failing silently", async () => {
        execute.mockResolvedValue(loginResponse({ data: { ...identityDto, permissions: [] } }));

        await presenter().signIn("user-1@webiny.local", "password");

        expect(presenter().vm.authState).toBe("signIn");
        expect(presenter().vm.signIn.message).toEqual({
            title: "Login Failed",
            text: "You have no permissions on this tenant!",
            type: "danger"
        });
        // The Cognito session is closed, so the user can sign in again.
        expect(amplify.signOut).toHaveBeenCalled();
    });
});

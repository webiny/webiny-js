import { describe, test, expect, beforeEach } from "vitest";
import { ContextPlugin } from "@webiny/api";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { useGqlHandler } from "../useGqlHandler";
import { Result } from "@webiny/feature/api";
import { AfterLoginEventHandler } from "~/features/security/login/index.js";
import { GetIdentityProfileUseCase } from "~/features/users/GetIdentityProfile/index.js";
import { ResolveIdentityTenantsUseCase } from "~/features/security/ResolveIdentityTenants/index.js";
import { UserStorageError } from "~/features/users/shared/errors.js";
import type { ApiCoreContext, ApiCoreStorageOperations } from "~/types/core.js";
import type { AdminUser } from "~/types/users.js";
import type { Tenant } from "~/types/tenancy.js";

/**
 * Authenticates `Bearer native:<id>` as a native identity, and `Bearer external:<id>` as an
 * identity coming from a federated IdP.
 */
const testAuthenticator = () => {
    return new ContextPlugin<ApiCoreContext>(context => {
        context.security.addAuthenticator(async token => {
            const [kind, id] = token.split(":");
            if (kind !== "native" && kind !== "external") {
                return null;
            }

            return {
                id,
                displayName: id,
                type: "admin",
                profile: {
                    email: `${id}@webiny.local`,
                    external: kind === "external"
                }
            };
        });
    });
};

const afterLoginCalls: string[] = [];

const trackAfterLogin = () => {
    return new ContextPlugin<ApiCoreContext>(context => {
        context.container.registerFactory(AfterLoginEventHandler, () => ({
            handle: async (event: AfterLoginEventHandler.Event) => {
                afterLoginCalls.push(event.payload.identity.id);
            }
        }));
    });
};

/**
 * The profile read of `native:flaky` fails with a storage error.
 */
class FlakyProfileReadDecorator implements GetIdentityProfileUseCase.Interface {
    constructor(private decoratee: GetIdentityProfileUseCase.Interface) {}

    async execute(identityId: string): GetIdentityProfileUseCase.Return {
        if (identityId === "flaky") {
            return Result.fail(new UserStorageError(new Error("Storage is unavailable.")));
        }
        return this.decoratee.execute(identityId);
    }
}

const flakyProfileRead = () => {
    return new ContextPlugin<ApiCoreContext>(context => {
        context.container.registerDecorator(
            GetIdentityProfileUseCase.createDecorator({
                decorator: FlakyProfileReadDecorator,
                dependencies: []
            })
        );
    });
};

/**
 * The cross-tenant lookup of `native:flaky-lookup` fails with a storage error.
 */
class FlakyTenantLookupDecorator implements ResolveIdentityTenantsUseCase.Interface {
    constructor(private decoratee: ResolveIdentityTenantsUseCase.Interface) {}

    async execute(identityId: string): ResolveIdentityTenantsUseCase.Return {
        if (identityId === "flaky-lookup") {
            return Result.fail(new UserStorageError(new Error("Storage is unavailable.")));
        }
        return this.decoratee.execute(identityId);
    }
}

const flakyTenantLookup = () => {
    return new ContextPlugin<ApiCoreContext>(context => {
        context.container.registerDecorator(
            ResolveIdentityTenantsUseCase.createDecorator({
                decorator: FlakyTenantLookupDecorator,
                dependencies: []
            })
        );
    });
};

const createTenantData = (id: string, overrides: Partial<Tenant> = {}): Tenant => {
    return {
        id,
        name: `Tenant ${id}`,
        description: "",
        status: "enabled",
        isInstalled: true,
        settings: {},
        tags: [],
        parent: "root",
        createdOn: new Date().toISOString(),
        savedOn: new Date().toISOString(),
        ...overrides
    };
};

const createUserData = (id: string, tenant: string): AdminUser => {
    return {
        id,
        tenant,
        email: `${id}@webiny.local`,
        displayName: id,
        createdOn: new Date().toISOString(),
        createdBy: null
    };
};

const LOGIN_WITH_ERROR = /* GraphQL */ `
    mutation Login {
        security {
            login {
                data {
                    id
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

describe("Tenant-aware login", () => {
    const { install, invoke } = useGqlHandler({
        plugins: [
            testAuthenticator(),
            trackAfterLogin(),
            flakyProfileRead(),
            flakyTenantLookup()
        ]
    });

    const storage = () => getStorageOps<ApiCoreStorageOperations>("apiCore").storageOperations;

    const login = async (token: string) => {
        const [response] = await invoke({
            body: { query: LOGIN_WITH_ERROR },
            headers: { authorization: `Bearer ${token}` }
        });
        return response.data.security.login;
    };

    beforeEach(async () => {
        afterLoginCalls.length = 0;

        const [response] = await install.install({ "x-tenant": "root" });
        if (response.data.system.installSystem.error) {
            throw new Error(response.data.system.installSystem.error.message);
        }

        const { tenancyStorageOperations } = storage();
        await tenancyStorageOperations.createTenant(createTenantData("acme", { name: "Acme" }));
        await tenancyStorageOperations.createTenant(createTenantData("beta", { name: "Beta" }));
        await tenancyStorageOperations.createTenant(
            createTenantData("gamma", { name: "Gamma", status: "disabled" })
        );
    });

    describe("getUserAcrossTenants", () => {
        test("returns the user's record from every given tenant that has one", async () => {
            const { usersStorageOperations } = storage();
            await usersStorageOperations.createUser({ user: createUserData("u1", "acme") });
            await usersStorageOperations.createUser({ user: createUserData("u1", "beta") });
            await usersStorageOperations.createUser({ user: createUserData("u2", "acme") });

            const users = await usersStorageOperations.getUserAcrossTenants({
                id: "u1",
                tenants: ["root", "acme", "beta", "gamma"]
            });

            expect(users.map(user => user.tenant).sort()).toEqual(["acme", "beta"]);
            expect(users.every(user => user.id === "u1")).toBe(true);
        });

        test("returns nothing for an empty tenant list", async () => {
            const { usersStorageOperations } = storage();
            await usersStorageOperations.createUser({ user: createUserData("u1", "acme") });

            const users = await usersStorageOperations.getUserAcrossTenants({
                id: "u1",
                tenants: []
            });

            expect(users).toEqual([]);
        });

        test("reads more than 100 tenants", async () => {
            const { usersStorageOperations } = storage();
            await usersStorageOperations.createUser({ user: createUserData("u1", "t-149") });

            const tenants = Array.from({ length: 150 }, (_, index) => `t-${index}`);
            const users = await usersStorageOperations.getUserAcrossTenants({ id: "u1", tenants });

            expect(users.map(user => user.tenant)).toEqual(["t-149"]);
        });
    });

    describe("security.login on root", () => {
        test("a user who exists only in a sub-tenant gets that tenant, and AfterLogin is not published", async () => {
            await storage().usersStorageOperations.createUser({
                user: createUserData("sub-user", "acme")
            });

            const result = await login("native:sub-user");

            expect(result).toEqual({
                data: null,
                error: {
                    code: "Security/Identity/TenantSelectionRequired",
                    message: "Your user account belongs to a different tenant.",
                    data: { tenants: [{ id: "acme", name: "Acme" }] }
                }
            });
            expect(afterLoginCalls).toEqual([]);

            // No record was created in root.
            const rootUser = await storage().usersStorageOperations.getUser({
                where: { tenant: "root", id: "sub-user" }
            });
            expect(rootUser).toBeNull();
        });

        test("a user in several tenants gets all of them, sorted by name, without disabled tenants", async () => {
            const { usersStorageOperations } = storage();
            await usersStorageOperations.createUser({ user: createUserData("multi", "beta") });
            await usersStorageOperations.createUser({ user: createUserData("multi", "acme") });
            await usersStorageOperations.createUser({ user: createUserData("multi", "gamma") });

            const result = await login("native:multi");

            expect(result.error.code).toBe("Security/Identity/TenantSelectionRequired");
            expect(result.error.data.tenants).toEqual([
                { id: "acme", name: "Acme" },
                { id: "beta", name: "Beta" }
            ]);
        });

        test("a user whose only tenant is disabled is not authorized", async () => {
            await storage().usersStorageOperations.createUser({
                user: createUserData("disabled-only", "gamma")
            });

            const result = await login("native:disabled-only");

            expect(result.error.code).toBe("Security/Identity/NotAuthorized");
            expect(afterLoginCalls).toEqual([]);
        });

        test("a user without a record in any tenant is not authorized", async () => {
            const result = await login("native:nobody");

            expect(result).toEqual({
                data: null,
                error: {
                    code: "Security/Identity/NotAuthorized",
                    message: "Missing user profile!",
                    data: null
                }
            });
            expect(afterLoginCalls).toEqual([]);
        });

        test("a failed profile read fails the login instead of offering tenants", async () => {
            const { usersStorageOperations } = storage();
            await usersStorageOperations.createUser({ user: createUserData("flaky", "root") });
            await usersStorageOperations.createUser({ user: createUserData("flaky", "acme") });

            const result = await login("native:flaky");

            expect(result).toEqual({
                data: null,
                error: {
                    code: "AdminUser/Persistence",
                    message: "Storage is unavailable.",
                    data: null
                }
            });
            expect(afterLoginCalls).toEqual([]);
        });

        test("a failed tenant lookup fails the login instead of saying the user has no access", async () => {
            await storage().usersStorageOperations.createUser({
                user: createUserData("flaky-lookup", "acme")
            });

            const result = await login("native:flaky-lookup");

            expect(result).toEqual({
                data: null,
                error: {
                    code: "AdminUser/Persistence",
                    message: "Storage is unavailable.",
                    data: null
                }
            });
            expect(afterLoginCalls).toEqual([]);
        });

        test("a root user logs in as before, and AfterLogin is published", async () => {
            const { usersStorageOperations } = storage();
            await usersStorageOperations.createUser({ user: createUserData("root-user", "root") });
            await usersStorageOperations.createUser({ user: createUserData("root-user", "acme") });

            const result = await login("native:root-user");

            expect(result).toEqual({ data: { id: "root-user" }, error: null });
            expect(afterLoginCalls).toEqual(["root-user"]);
        });

        test("a federated identity keeps today's behaviour: AfterLogin runs first and provisions the user", async () => {
            await storage().usersStorageOperations.createUser({
                user: createUserData("fed-user", "acme")
            });

            const result = await login("external:fed-user");

            expect(result).toEqual({ data: { id: "fed-user" }, error: null });
            expect(afterLoginCalls).toEqual(["fed-user"]);

            const rootUser = await storage().usersStorageOperations.getUser({
                where: { tenant: "root", id: "fed-user" }
            });
            expect(rootUser).toMatchObject({ id: "fed-user", tenant: "root", external: true });
        });
    });
});

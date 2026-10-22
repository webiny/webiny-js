import { describe, test, expect, beforeEach } from "vitest";
import { ContextPlugin } from "@webiny/api";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { useGqlHandler } from "../useGqlHandler";
import { Result } from "@webiny/feature/api";
import { AfterLoginEventHandler } from "~/features/security/login/index.js";
import { GetIdentityProfileUseCase } from "~/features/users/GetIdentityProfile/index.js";
import { ResolveIdentityTenantsUseCase } from "~/features/security/ResolveIdentityTenants/index.js";
import { UserStorageError } from "~/features/users/shared/errors.js";
import { FindUserRecordsUseCase } from "~/features/users/FindUserRecords/index.js";
import type { Container } from "@webiny/di";
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

let lastContainer: Container | undefined;

/**
 * Keeps the container of the last request, to call use cases directly.
 */
const captureContainer = () => {
    return new ContextPlugin<ApiCoreContext>(context => {
        lastContainer = context.container;
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

const LOGIN_WITH_TENANTS = /* GraphQL */ `
    mutation Login {
        security {
            login {
                data {
                    ... on SecurityIdentity {
                        id
                        tenants {
                            id
                            name
                        }
                    }
                }
                error {
                    code
                }
            }
        }
    }
`;

const LOGIN_WITH_ERROR = /* GraphQL */ `
    mutation Login {
        security {
            login {
                data {
                    __typename
                    ... on SecurityIdentity {
                        id
                    }
                    ... on SecurityLoginTenantSelection {
                        tenants {
                            id
                            name
                        }
                    }
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
            flakyTenantLookup(),
            captureContainer()
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
                data: {
                    __typename: "SecurityLoginTenantSelection",
                    tenants: [{ id: "acme", name: "Acme" }]
                },
                error: null
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

            expect(result.data.__typename).toBe("SecurityLoginTenantSelection");
            expect(result.data.tenants).toEqual([
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

            expect(result).toEqual({
                data: { __typename: "SecurityIdentity", id: "root-user" },
                error: null
            });
            expect(afterLoginCalls).toEqual(["root-user"]);
        });

        test("a federated identity keeps today's behaviour: AfterLogin runs first and provisions the user", async () => {
            await storage().usersStorageOperations.createUser({
                user: createUserData("fed-user", "acme")
            });

            const result = await login("external:fed-user");

            expect(result).toEqual({
                data: { __typename: "SecurityIdentity", id: "fed-user" },
                error: null
            });
            expect(afterLoginCalls).toEqual(["fed-user"]);

            const rootUser = await storage().usersStorageOperations.getUser({
                where: { tenant: "root", id: "fed-user" }
            });
            expect(rootUser).toMatchObject({ id: "fed-user", tenant: "root", external: true });
        });
    });
    describe("user→tenant index", () => {
        /**
         * Writes a record the way storage did before the index existed (DynamoDB only: the SQL
         * index covers every row).
         */
        const createUnindexedUser = async (user: AdminUser) => {
            const usersStorage = storage().usersStorageOperations as any;
            await usersStorage.getEntities().users.put({
                PK: `T#${user.tenant}#ADMIN_USER#${user.id}`,
                SK: "A",
                GSI1_PK: `T#${user.tenant}#ADMIN_USERS`,
                GSI1_SK: user.email,
                GSI_TENANT: user.tenant,
                TYPE: "adminUsers.user",
                data: user
            });
        };

        const isDynamoDb = () => "getEntities" in storage().usersStorageOperations;

        const findUserRecords = async (id: string, options?: FindUserRecordsUseCase.Options) => {
            // Any request gives a container to resolve the use case from.
            await login("native:nobody");
            const useCase = lastContainer!.resolve(FindUserRecordsUseCase);
            return useCase.execute(id, options);
        };

        test("listUserRecords returns the user's record from every tenant", async () => {
            const { usersStorageOperations } = storage();
            await usersStorageOperations.createUser({ user: createUserData("u1", "root") });
            await usersStorageOperations.createUser({ user: createUserData("u1", "acme") });
            await usersStorageOperations.createUser({ user: createUserData("u2", "acme") });

            const users = await usersStorageOperations.listUserRecords({ id: "u1" });

            expect(users.map(user => user.tenant).sort()).toEqual(["acme", "root"]);
        });

        test("an update keeps the record in the index", async () => {
            const { usersStorageOperations } = storage();
            const user = createUserData("u1", "acme");
            await usersStorageOperations.createUser({ user });
            await usersStorageOperations.updateUser({ user: { ...user, firstName: "New" } });

            const users = await usersStorageOperations.listUserRecords({ id: "u1" });

            expect(users).toEqual([{ ...user, firstName: "New" }]);
        });

        test("a deleted record leaves the index", async () => {
            const { usersStorageOperations } = storage();
            const user = createUserData("u1", "acme");
            await usersStorageOperations.createUser({ user });
            await usersStorageOperations.deleteUser({ user });

            expect(await usersStorageOperations.listUserRecords({ id: "u1" })).toEqual([]);
        });

        test("login finds records written before the index, and adds them to it", async ({
            skip
        }) => {
            if (!isDynamoDb()) {
                skip();
            }
            await createUnindexedUser(createUserData("legacy", "acme"));
            await createUnindexedUser(createUserData("legacy", "beta"));
            expect(
                await storage().usersStorageOperations.listUserRecords({ id: "legacy" })
            ).toEqual([]);

            const result = await login("native:legacy");

            expect(result.data.__typename).toBe("SecurityLoginTenantSelection");
            expect(result.data.tenants).toEqual([
                { id: "acme", name: "Acme" },
                { id: "beta", name: "Beta" }
            ]);

            const indexed = await storage().usersStorageOperations.listUserRecords({
                id: "legacy"
            });
            expect(indexed.map(user => user.tenant).sort()).toEqual(["acme", "beta"]);
        });

        test("an exhaustive lookup also finds records the index is missing", async ({ skip }) => {
            if (!isDynamoDb()) {
                skip();
            }
            await createUnindexedUser(createUserData("partial", "acme"));
            await storage().usersStorageOperations.createUser({
                user: createUserData("partial", "gamma")
            });

            const quick = await findUserRecords("partial");
            expect(quick.value?.map(user => user.tenant)).toEqual(["gamma"]);

            // Disabled tenants count: the user still has a record there.
            const exhaustive = await findUserRecords("partial", { exhaustive: true });
            expect(exhaustive.value?.map(user => user.tenant).sort()).toEqual(["acme", "gamma"]);
        });

        test("an existing SQL table gets the index on its first use", async ({ skip }) => {
            const knex = (globalThis as any).__testKnex;
            if (isDynamoDb() || !knex) {
                skip();
            }
            const { usersStorageOperations } = storage();
            await usersStorageOperations.createUser({ user: createUserData("u1", "acme") });

            const [{ name: table }] = await knex("sqlite_master")
                .where("type", "table")
                .andWhere("name", "like", "%webiny_core_admin_users");
            const indexNames = async (): Promise<string[]> => {
                const indexes = await knex.raw(`PRAGMA index_list("${table}")`);
                return indexes.map((index: { name: string }) => index.name);
            };
            const idIndex = `${table}_id_index`;
            expect(await indexNames()).toContain(idIndex);

            // A table created before the index existed, seen by a new process.
            await knex.raw(`DROP INDEX "${idIndex}"`);
            for (const manager of (globalThis as any).__sqlTableManagers) {
                manager.reset();
            }

            const users = await usersStorageOperations.listUserRecords({ id: "u1" });

            expect(users.map(user => user.tenant)).toEqual(["acme"]);
            expect(await indexNames()).toContain(idIndex);
        });

        test("a record left behind by a deleted tenant is not offered", async () => {
            const { usersStorageOperations } = storage();
            await usersStorageOperations.createUser({ user: createUserData("orphan", "deleted") });
            await usersStorageOperations.createUser({ user: createUserData("orphan", "acme") });

            const result = await login("native:orphan");

            expect(result.data.tenants).toEqual([{ id: "acme", name: "Acme" }]);
        });

        test("login returns the identity's tenants, for switching between them", async () => {
            const { usersStorageOperations } = storage();
            await usersStorageOperations.createUser({ user: createUserData("multi", "root") });
            await usersStorageOperations.createUser({ user: createUserData("multi", "beta") });
            await usersStorageOperations.createUser({ user: createUserData("multi", "gamma") });

            const [response] = await invoke({
                body: { query: LOGIN_WITH_TENANTS },
                headers: { authorization: "Bearer native:multi" }
            });

            expect(response.data.security.login).toEqual({
                data: {
                    id: "multi",
                    tenants: [
                        { id: "beta", name: "Beta" },
                        { id: "root", name: "Root" }
                    ]
                },
                error: null
            });
        });
    });
});

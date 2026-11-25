import { describe, it, expect, beforeEach } from "vitest";
import { getStorageOps } from "~/testing/environment.js";
import type { ApiCoreStorageOperationsBuilder } from "~/features/storageOperations/abstractions.js";
import type { AdminUsersStorageOperations } from "~/types/users.js";
import type { SecurityStorageOperations } from "~/types/security.js";
import {
    createFixedScopeTenant,
    TenantScopeMismatchError
} from "~/features/tenancy/ScopeTenant/index.js";

const TENANT_A = "tenantA";
const TENANT_B = "tenantB";

/**
 * Each tenant's storage is built for its own tenant scope: tenant B's storage doesn't see tenant A's
 * records, and a storage given another tenant than its scope's throws.
 */
describe("Tenant Isolation", () => {
    let usersA: AdminUsersStorageOperations;
    let usersB: AdminUsersStorageOperations;
    let securityA: SecurityStorageOperations;
    let securityB: SecurityStorageOperations;

    beforeEach(() => {
        const build = getStorageOps<ApiCoreStorageOperationsBuilder>("apiCore").storageOperations;
        const a = build({ scopeTenant: createFixedScopeTenant(TENANT_A) });
        const b = build({ scopeTenant: createFixedScopeTenant(TENANT_B) });
        usersA = a.usersStorageOperations;
        usersB = b.usersStorageOperations;
        securityA = a.securityStorageOperations;
        securityB = b.securityStorageOperations;
    });

    describe("Admin Users", () => {
        const userA = {
            id: "user-1",
            tenant: TENANT_A,
            email: "admin@tenant-a.com",
            displayName: "Admin A",
            createdOn: new Date().toISOString(),
            createdBy: null
        };

        it("should not return users from another tenant by id", async () => {
            await usersA.createUser({ user: userA });

            const result = await usersB.getUser({
                where: { tenant: TENANT_B, id: userA.id }
            });

            expect(result).toBeNull();
        });

        it("should not return users from another tenant by email", async () => {
            await usersA.createUser({ user: userA });

            const result = await usersB.getUser({
                where: { tenant: TENANT_B, email: userA.email }
            });

            expect(result).toBeNull();
        });

        it("should not list users from another tenant", async () => {
            await usersA.createUser({ user: userA });

            const result = await usersB.listUsers({
                where: { tenant: TENANT_B }
            });

            expect(result).toHaveLength(0);
        });

        it("should not update users from another tenant", async () => {
            await usersA.createUser({ user: userA });

            await usersB.updateUser({
                user: { ...userA, tenant: TENANT_B, displayName: "Hacked" }
            });

            const original = await usersA.getUser({
                where: { tenant: TENANT_A, id: userA.id }
            });

            expect(original).not.toBeNull();
            expect(original!.displayName).toBe("Admin A");
        });

        it("should not delete users from another tenant", async () => {
            await usersA.createUser({ user: userA });

            await usersB.deleteUser({
                user: { ...userA, tenant: TENANT_B }
            });

            const result = await usersA.getUser({
                where: { tenant: TENANT_A, id: userA.id }
            });

            expect(result).not.toBeNull();
        });
    });

    describe("Roles", () => {
        const roleA = {
            id: "role-1",
            tenant: TENANT_A,
            name: "Editor",
            slug: "editor",
            description: "Editor role",
            system: false,
            permissions: [{ name: "content.*" }],
            createdOn: new Date().toISOString(),
            createdBy: null
        };

        it("should not return roles from another tenant by id", async () => {
            await securityA.createRole({ role: roleA });

            const result = await securityB.getRole({
                where: { tenant: TENANT_B, id: roleA.id }
            });

            expect(result).toBeNull();
        });

        it("should not return roles from another tenant by slug", async () => {
            await securityA.createRole({ role: roleA });

            const result = await securityB.getRole({
                where: { tenant: TENANT_B, slug: roleA.slug }
            });

            expect(result).toBeNull();
        });

        it("should not list roles from another tenant", async () => {
            await securityA.createRole({ role: roleA });

            const result = await securityB.listRoles({
                where: { tenant: TENANT_B }
            });

            expect(result).toHaveLength(0);
        });

        it("should not delete roles from another tenant", async () => {
            await securityA.createRole({ role: roleA });

            await securityB.deleteRole({
                role: { ...roleA, tenant: TENANT_B }
            });

            const result = await securityA.getRole({
                where: { tenant: TENANT_A, id: roleA.id }
            });

            expect(result).not.toBeNull();
        });
    });

    describe("Teams", () => {
        const teamA = {
            id: "team-1",
            tenant: TENANT_A,
            name: "Engineering",
            slug: "engineering",
            description: "Engineering team",
            system: false,
            roles: ["role-1"],
            createdOn: new Date().toISOString(),
            createdBy: null
        };

        it("should not return teams from another tenant by id", async () => {
            await securityA.createTeam({ team: teamA });

            const result = await securityB.getTeam({
                where: { tenant: TENANT_B, id: teamA.id }
            });

            expect(result).toBeNull();
        });

        it("should not return teams from another tenant by slug", async () => {
            await securityA.createTeam({ team: teamA });

            const result = await securityB.getTeam({
                where: { tenant: TENANT_B, slug: teamA.slug }
            });

            expect(result).toBeNull();
        });

        it("should not list teams from another tenant", async () => {
            await securityA.createTeam({ team: teamA });

            const result = await securityB.listTeams({
                where: { tenant: TENANT_B }
            });

            expect(result).toHaveLength(0);
        });

        it("should not delete teams from another tenant", async () => {
            await securityA.createTeam({ team: teamA });

            await securityB.deleteTeam({
                team: { ...teamA, tenant: TENANT_B }
            });

            const result = await securityA.getTeam({
                where: { tenant: TENANT_A, id: teamA.id }
            });

            expect(result).not.toBeNull();
        });
    });

    describe("API Keys", () => {
        const apiKeyA = {
            id: "key-1",
            tenant: TENANT_A,
            name: "CI Key",
            slug: "ci-key",
            description: "CI pipeline key",
            token: "secret-token-123",
            permissions: [{ name: "*" }],
            createdBy: { id: "user-1", displayName: "Admin", type: "admin" },
            createdOn: new Date().toISOString()
        };

        it("should not return api keys from another tenant by id", async () => {
            await securityA.createApiKey({ apiKey: apiKeyA });

            const result = await securityB.getApiKey({
                tenant: TENANT_B,
                id: apiKeyA.id
            });

            expect(result).toBeNull();
        });

        it("should not return api keys from another tenant by token", async () => {
            await securityA.createApiKey({ apiKey: apiKeyA });

            const result = await securityB.getApiKeyByToken({
                tenant: TENANT_B,
                token: apiKeyA.token
            });

            expect(result).toBeNull();
        });

        it("should not return api keys from another tenant by slug", async () => {
            await securityA.createApiKey({ apiKey: apiKeyA });

            const result = await securityB.getApiKeyBySlug({
                tenant: TENANT_B,
                slug: apiKeyA.slug
            });

            expect(result).toBeNull();
        });

        it("should not list api keys from another tenant", async () => {
            await securityA.createApiKey({ apiKey: apiKeyA });

            const result = await securityB.listApiKeys({
                where: { tenant: TENANT_B }
            });

            expect(result).toHaveLength(0);
        });

        it("should not delete api keys from another tenant", async () => {
            await securityA.createApiKey({ apiKey: apiKeyA });

            await securityB.deleteApiKey({
                apiKey: { ...apiKeyA, tenant: TENANT_B }
            });

            const result = await securityA.getApiKey({
                tenant: TENANT_A,
                id: apiKeyA.id
            });

            expect(result).not.toBeNull();
        });
    });

    describe("A tenant other than the scope's", () => {
        const userA = {
            id: "user-1",
            tenant: TENANT_A,
            email: "admin@tenant-a.com",
            displayName: "Admin A",
            createdOn: new Date().toISOString(),
            createdBy: null
        };

        it("throws when reading with another tenant", async () => {
            await usersA.createUser({ user: userA });

            await expect(
                usersA.getUser({ where: { tenant: TENANT_B, id: userA.id } })
            ).rejects.toThrow(TenantScopeMismatchError);
            await expect(securityA.listRoles({ where: { tenant: TENANT_B } })).rejects.toThrow(
                TenantScopeMismatchError
            );
            await expect(
                securityA.getApiKeyByToken({ tenant: TENANT_B, token: "secret-token-123" })
            ).rejects.toThrow(TenantScopeMismatchError);
        });

        it("throws when writing a record of another tenant, and writes nothing", async () => {
            await expect(
                usersA.createUser({ user: { ...userA, tenant: TENANT_B } })
            ).rejects.toThrow(TenantScopeMismatchError);
            await expect(
                securityA.createRole({
                    role: {
                        id: "role-1",
                        tenant: TENANT_B,
                        name: "Editor",
                        slug: "editor",
                        description: "",
                        system: false,
                        permissions: [],
                        createdOn: new Date().toISOString(),
                        createdBy: null
                    }
                })
            ).rejects.toThrow(TenantScopeMismatchError);

            expect(await usersB.getUser({ where: { tenant: TENANT_B, id: userA.id } })).toBeNull();
            expect(await securityB.listRoles({ where: { tenant: TENANT_B } })).toHaveLength(0);
        });

        it("writes the scope's tenant", async () => {
            await usersA.createUser({ user: userA });

            const [record] = await usersA.listUsers({ where: { tenant: TENANT_A } });
            expect(record.tenant).toBe(TENANT_A);
        });
    });
});

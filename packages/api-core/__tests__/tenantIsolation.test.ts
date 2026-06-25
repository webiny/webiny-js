import { describe, it, expect, beforeEach } from "vitest";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import type { ApiCoreStorageOperations } from "~/types/core.js";
import type { AdminUsersStorageOperations } from "~/types/users.js";
import type { SecurityStorageOperations } from "~/types/security.js";

const TENANT_A = "tenantA";
const TENANT_B = "tenantB";

describe("Tenant Isolation", () => {
    let users: AdminUsersStorageOperations;
    let security: SecurityStorageOperations;

    beforeEach(() => {
        const ops = getStorageOps<ApiCoreStorageOperations>("apiCore");
        users = ops.storageOperations.usersStorageOperations;
        security = ops.storageOperations.securityStorageOperations;
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
            await users.createUser({ user: userA });

            const result = await users.getUser({
                where: { tenant: TENANT_B, id: userA.id }
            });

            expect(result).toBeNull();
        });

        it("should not return users from another tenant by email", async () => {
            await users.createUser({ user: userA });

            const result = await users.getUser({
                where: { tenant: TENANT_B, email: userA.email }
            });

            expect(result).toBeNull();
        });

        it("should not list users from another tenant", async () => {
            await users.createUser({ user: userA });

            const result = await users.listUsers({
                where: { tenant: TENANT_B }
            });

            expect(result).toHaveLength(0);
        });

        it("should not update users from another tenant", async () => {
            await users.createUser({ user: userA });

            await users.updateUser({
                user: { ...userA, tenant: TENANT_B, displayName: "Hacked" }
            });

            const original = await users.getUser({
                where: { tenant: TENANT_A, id: userA.id }
            });

            expect(original).not.toBeNull();
            expect(original!.displayName).toBe("Admin A");
        });

        it("should not delete users from another tenant", async () => {
            await users.createUser({ user: userA });

            await users.deleteUser({
                user: { ...userA, tenant: TENANT_B }
            });

            const result = await users.getUser({
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
            await security.createRole({ role: roleA });

            const result = await security.getRole({
                where: { tenant: TENANT_B, id: roleA.id }
            });

            expect(result).toBeNull();
        });

        it("should not return roles from another tenant by slug", async () => {
            await security.createRole({ role: roleA });

            const result = await security.getRole({
                where: { tenant: TENANT_B, slug: roleA.slug }
            });

            expect(result).toBeNull();
        });

        it("should not list roles from another tenant", async () => {
            await security.createRole({ role: roleA });

            const result = await security.listRoles({
                where: { tenant: TENANT_B }
            });

            expect(result).toHaveLength(0);
        });

        it("should not delete roles from another tenant", async () => {
            await security.createRole({ role: roleA });

            await security.deleteRole({
                role: { ...roleA, tenant: TENANT_B }
            });

            const result = await security.getRole({
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
            await security.createTeam({ team: teamA });

            const result = await security.getTeam({
                where: { tenant: TENANT_B, id: teamA.id }
            });

            expect(result).toBeNull();
        });

        it("should not return teams from another tenant by slug", async () => {
            await security.createTeam({ team: teamA });

            const result = await security.getTeam({
                where: { tenant: TENANT_B, slug: teamA.slug }
            });

            expect(result).toBeNull();
        });

        it("should not list teams from another tenant", async () => {
            await security.createTeam({ team: teamA });

            const result = await security.listTeams({
                where: { tenant: TENANT_B }
            });

            expect(result).toHaveLength(0);
        });

        it("should not delete teams from another tenant", async () => {
            await security.createTeam({ team: teamA });

            await security.deleteTeam({
                team: { ...teamA, tenant: TENANT_B }
            });

            const result = await security.getTeam({
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
            await security.createApiKey({ apiKey: apiKeyA });

            const result = await security.getApiKey({
                tenant: TENANT_B,
                id: apiKeyA.id
            });

            expect(result).toBeNull();
        });

        it("should not return api keys from another tenant by token", async () => {
            await security.createApiKey({ apiKey: apiKeyA });

            const result = await security.getApiKeyByToken({
                tenant: TENANT_B,
                token: apiKeyA.token
            });

            expect(result).toBeNull();
        });

        it("should not return api keys from another tenant by slug", async () => {
            await security.createApiKey({ apiKey: apiKeyA });

            const result = await security.getApiKeyBySlug({
                tenant: TENANT_B,
                slug: apiKeyA.slug
            });

            expect(result).toBeNull();
        });

        it("should not list api keys from another tenant", async () => {
            await security.createApiKey({ apiKey: apiKeyA });

            const result = await security.listApiKeys({
                where: { tenant: TENANT_B }
            });

            expect(result).toHaveLength(0);
        });

        it("should not delete api keys from another tenant", async () => {
            await security.createApiKey({ apiKey: apiKeyA });

            await security.deleteApiKey({
                apiKey: { ...apiKeyA, tenant: TENANT_B }
            });

            const result = await security.getApiKey({
                tenant: TENANT_A,
                id: apiKeyA.id
            });

            expect(result).not.toBeNull();
        });
    });
});

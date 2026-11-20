import { describe, it, expect, vi } from "vitest";
import { CanAccessCurrentTenantUseCase } from "~/features/security/CanAccessCurrentTenant/CanAccessCurrentTenantUseCase.js";
import { AnonymousIdentity } from "~/features/security/IdentityContext/index.js";
import { AuthenticatedIdentity } from "~/features/security/IdentityContext/index.js";
import type { Identity } from "~/features/security/IdentityContext/index.js";
import type { IdentityContext } from "~/features/security/IdentityContext/index.js";
import type { AuthorizationContext } from "~/features/security/authorization/AuthorizationContext/index.js";
import type { SecurityPermission } from "~/types/security.js";

const user = new AuthenticatedIdentity({ id: "user-1", displayName: "User One", type: "admin" });

const createUseCase = (identity: Identity, permissions: SecurityPermission[]) => {
    const identityContext = {
        getIdentity: () => identity,
        // With AACL on, this list is never empty, so the use case must not read it.
        listPermissions: async () => [...permissions, { name: "aacl" }]
    } as unknown as IdentityContext.Interface;
    const loadPermissions = vi.fn(async () => permissions);
    const authorizationContext = {
        loadPermissions
    } as unknown as AuthorizationContext.Interface;

    const useCase = new CanAccessCurrentTenantUseCase(identityContext, authorizationContext);
    return { useCase, loadPermissions };
};

describe("CanAccessCurrentTenantUseCase", () => {
    it("allows an identity with permissions in the tenant", async () => {
        const { useCase } = createUseCase(user, [{ name: "cms.*" }]);

        expect(await useCase.execute()).toBe(true);
    });

    it("refuses an identity with no permissions in the tenant", async () => {
        const { useCase } = createUseCase(user, []);

        expect(await useCase.execute()).toBe(false);
    });

    it("refuses the anonymous identity without loading permissions", async () => {
        const { useCase, loadPermissions } = createUseCase(new AnonymousIdentity(), [
            { name: "*" }
        ]);

        expect(await useCase.execute()).toBe(false);
        expect(loadPermissions).not.toHaveBeenCalled();
    });
});

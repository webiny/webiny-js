import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { License } from "@webiny/wcp";
import { WcpContextFeature } from "~/features/wcp/WcpContext/index.js";
import { ApiCoreFeature } from "~/ApiCoreFeature.js";
import type { ApiCoreStorageOperations } from "~/types/core.js";
import { RootTenantValue } from "~/domain/tenancy/RootTenantValue.js";
import type { SecurityPermission } from "~/types/security.js";
import { Authorizer } from "~/features/security/authorization/Authorizer/index.js";
import { TenantContext } from "~/features/tenancy/TenantContext/index.js";
import { AuthorizationContext } from "~/features/security/authorization/AuthorizationContext/index.js";
import { CreateApiKeyUseCase } from "~/features/security/apiKeys/CreateApiKey/index.js";
import { UpdateApiKeyUseCase } from "~/features/security/apiKeys/UpdateApiKey/index.js";
import { CreateRoleUseCase } from "~/features/security/roles/CreateRole/index.js";
import { UpdateRoleUseCase } from "~/features/security/roles/UpdateRole/index.js";

class TestAuthorizer implements Authorizer.Interface {
    public permissions: SecurityPermission[] = [{ name: "*" }];

    async authorize(): Promise<SecurityPermission[] | null> {
        return this.permissions;
    }
}

describe("Permission escalation through API keys and roles", () => {
    const setup = () => {
        const container = new Container();

        const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
        const testLicense = License.fromLicenseDto(createTestWcpLicense());

        ApiCoreFeature.register(container, apiCoreStorage.storageOperations);
        WcpContextFeature.register(container, testLicense);
        const authorizer = new TestAuthorizer();
        container.registerInstance(Authorizer, authorizer);

        const tenantContext = container.resolve(TenantContext);
        tenantContext.setTenant(RootTenantValue.create());

        const authorizationContext = container.resolve(AuthorizationContext);
        const setPermissions = (permissions: SecurityPermission[]) => {
            authorizer.permissions = permissions;
            authorizationContext.clearPermissionsCache();
        };

        return {
            setPermissions,
            createApiKey: container.resolve(CreateApiKeyUseCase),
            updateApiKey: container.resolve(UpdateApiKeyUseCase),
            createRole: container.resolve(CreateRoleUseCase),
            updateRole: container.resolve(UpdateRoleUseCase)
        };
    };

    describe("API keys", () => {
        it("should not allow creating an API key with permissions the caller does not have", async () => {
            const { setPermissions, createApiKey } = setup();
            setPermissions([{ name: "security.apiKey" }]);

            const fullAccess = await createApiKey.execute({
                name: "Full access",
                slug: "full-access",
                description: "",
                permissions: [{ name: "*" }]
            });
            expect(fullAccess.isFail()).toBe(true);
            expect(fullAccess.error).toMatchObject({
                code: "ApiKey/NotAuthorized",
                message: `Not authorized to grant permission "*".`
            });

            const cms = await createApiKey.execute({
                name: "CMS",
                slug: "cms",
                description: "",
                permissions: [{ name: "cms.contentEntry", rwd: "rwd" }]
            });
            expect(cms.isFail()).toBe(true);
            expect(cms.error).toMatchObject({ code: "ApiKey/NotAuthorized" });
        });

        it("should allow creating an API key with permissions covered by the caller", async () => {
            const { setPermissions, createApiKey } = setup();
            setPermissions([{ name: "security.apiKey" }, { name: "cms.*" }]);

            const result = await createApiKey.execute({
                name: "CMS",
                slug: "cms",
                description: "",
                permissions: [{ name: "cms.contentEntry", rwd: "r" }, { name: "cms.*" }]
            });
            expect(result.isOk()).toBe(true);

            // A wildcard the caller does not hold is not covered by a narrower one.
            setPermissions([{ name: "security.apiKey" }, { name: "cms.contentEntry" }]);
            const wildcard = await createApiKey.execute({
                name: "CMS wildcard",
                slug: "cms-wildcard",
                description: "",
                permissions: [{ name: "cms.*" }]
            });
            expect(wildcard.isFail()).toBe(true);
            expect(wildcard.error).toMatchObject({ code: "ApiKey/NotAuthorized" });
        });

        it("should not allow updating an API key with permissions the caller does not have", async () => {
            const { setPermissions, createApiKey, updateApiKey } = setup();

            const created = await createApiKey.execute({
                name: "Key",
                slug: "key",
                description: "",
                permissions: [{ name: "fm.file", rwd: "rwd" }]
            });
            expect(created.isOk()).toBe(true);
            const apiKey = created.value;

            setPermissions([{ name: "security.apiKey" }]);

            const escalated = await updateApiKey.execute(apiKey.id, {
                permissions: [{ name: "*" }]
            });
            expect(escalated.isFail()).toBe(true);
            expect(escalated.error).toMatchObject({ code: "ApiKey/NotAuthorized" });

            // Keeping the permissions the key already has is allowed.
            const unchanged = await updateApiKey.execute(apiKey.id, {
                name: "Renamed key",
                permissions: [{ name: "fm.file", rwd: "rwd" }]
            });
            expect(unchanged.isOk()).toBe(true);

            // Changing an existing permission the caller does not have is not allowed.
            const changed = await updateApiKey.execute(apiKey.id, {
                permissions: [{ name: "fm.file", rwd: "r" }]
            });
            expect(changed.isFail()).toBe(true);
            expect(changed.error).toMatchObject({ code: "ApiKey/NotAuthorized" });
        });
    });

    describe("Roles", () => {
        it("should not allow creating a role with permissions the caller does not have", async () => {
            const { setPermissions, createRole } = setup();
            setPermissions([{ name: "security.role" }]);

            const result = await createRole.execute({
                name: "Full access",
                slug: "escalated-full-access",
                description: "",
                permissions: [{ name: "*" }]
            });
            expect(result.isFail()).toBe(true);
            expect(result.error).toMatchObject({
                code: "NOT_AUTHORIZED",
                message: `Not authorized to grant permission "*".`
            });
        });

        it("should allow creating a role with permissions covered by the caller", async () => {
            const { setPermissions, createRole } = setup();
            setPermissions([{ name: "security.role" }, { name: "cms.*" }]);

            const result = await createRole.execute({
                name: "CMS",
                slug: "cms-role",
                description: "",
                permissions: [{ name: "cms.contentEntry", rwd: "r" }]
            });
            expect(result.isOk()).toBe(true);
        });

        it("should not allow updating a role with permissions the caller does not have", async () => {
            const { setPermissions, createRole, updateRole } = setup();

            const created = await createRole.execute({
                name: "Role",
                slug: "role",
                description: "",
                permissions: [{ name: "fm.file", rwd: "rwd" }]
            });
            expect(created.isOk()).toBe(true);
            const role = created.value;

            setPermissions([{ name: "security.role" }]);

            const escalated = await updateRole.execute(role.id, {
                permissions: [{ name: "*" }]
            });
            expect(escalated.isFail()).toBe(true);
            expect(escalated.error).toMatchObject({ code: "NOT_AUTHORIZED" });

            // Updates that keep the stored permissions, or leave them out, are allowed.
            const unchanged = await updateRole.execute(role.id, {
                name: "Renamed role",
                permissions: [{ name: "fm.file", rwd: "rwd" }]
            });
            expect(unchanged.isOk()).toBe(true);

            const withoutPermissions = await updateRole.execute(role.id, {
                description: "Updated description"
            });
            expect(withoutPermissions.isOk()).toBe(true);
        });
    });
});

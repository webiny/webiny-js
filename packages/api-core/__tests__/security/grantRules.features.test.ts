import { beforeEach, describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { License } from "@webiny/wcp";
import { WcpContextFeature } from "~/features/wcp/WcpContext/index.js";
import { ApiCoreFeature } from "~/ApiCoreFeature.js";
import type { ApiCoreStorageOperations } from "~/types/core.js";
import type { Tenant } from "~/types/tenancy.js";
import { RootTenantValue } from "~/domain/tenancy/RootTenantValue.js";
import type { SecurityPermission } from "~/types/security.js";
import { Authorizer } from "~/features/security/authorization/Authorizer/index.js";
import { TenantContext } from "~/features/tenancy/TenantContext/index.js";
import {
    AuthenticatedIdentity,
    IdentityContext
} from "~/features/security/IdentityContext/index.js";
import { CreateApiKeyUseCase } from "~/features/security/apiKeys/CreateApiKey/index.js";
import { UpdateApiKeyUseCase } from "~/features/security/apiKeys/UpdateApiKey/index.js";
import { ListApiKeysUseCase } from "~/features/security/apiKeys/ListApiKeys/index.js";
import { GetApiKeyUseCase } from "~/features/security/apiKeys/GetApiKey/index.js";
import { GetApiKeyByTokenUseCase } from "~/features/security/apiKeys/GetApiKeyByToken/index.js";
import { CreateRoleUseCase } from "~/features/security/roles/CreateRole/index.js";
import { UpdateRoleUseCase } from "~/features/security/roles/UpdateRole/index.js";
import { DeleteRoleUseCase } from "~/features/security/roles/DeleteRole/index.js";
import { RolesRepository } from "~/features/security/roles/shared/abstractions.js";
import { CreateTeam } from "~/features/security/teams/CreateTeam/index.js";
import { UpdateTeam } from "~/features/security/teams/UpdateTeam/index.js";
import { CreateUserUseCase } from "~/features/users/CreateUser/index.js";
import { UpdateUserUseCase } from "~/features/users/UpdateUser/index.js";
import { DeleteUserUseCase } from "~/features/users/DeleteUser/index.js";
import type { Role } from "~/features/security/roles/shared/types.js";

class TestAuthorizer implements Authorizer.Interface {
    public permissions: SecurityPermission[] = [{ name: "*" }];

    async authorize(): Promise<SecurityPermission[] | null> {
        return this.permissions;
    }
}

const LIMITED_PERMISSIONS: SecurityPermission[] = [
    { name: "security.role" },
    { name: "security.apiKey" },
    { name: "security.team" },
    { name: "adminUsers.user" },
    { name: "fm.file", rwd: "rw" }
];

describe("Granting permissions: only what the caller holds", () => {
    let container: Container;
    let authorizer: TestAuthorizer;

    const signInWith = (permissions: SecurityPermission[]) => {
        authorizer.permissions = permissions;
        // Setting the identity also clears the permissions cache.
        container
            .resolve(IdentityContext)
            .setIdentity(
                new AuthenticatedIdentity({ id: "caller", displayName: "Caller", type: "admin" })
            );
    };

    const asSystem = <T>(cb: () => Promise<T>) => {
        return container.resolve(IdentityContext).withoutAuthorization(cb);
    };

    const createRole = async (slug: string, permissions: SecurityPermission[], system = false) => {
        const result = await asSystem(() =>
            container.resolve(CreateRoleUseCase).execute({
                name: slug,
                slug,
                description: "",
                permissions,
                system
            })
        );
        expect(result.isOk()).toBe(true);
        return result.value as Role;
    };

    beforeEach(() => {
        container = new Container();

        const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
        const testLicense = License.fromLicenseDto(createTestWcpLicense());

        ApiCoreFeature.register(container, apiCoreStorage.storageOperations);
        WcpContextFeature.register(container, testLicense);
        authorizer = new TestAuthorizer();
        container.registerInstance(Authorizer, authorizer);

        container.resolve(TenantContext).setTenant(RootTenantValue.create());
        signInWith([{ name: "*" }]);
    });

    describe("API keys", () => {
        const input = {
            name: "Key",
            slug: "key",
            description: "",
            permissions: [{ name: "fm.file", rwd: "r" }]
        };

        it("full access may create and update an API key", async () => {
            const created = await container.resolve(CreateApiKeyUseCase).execute(input);
            expect(created.isOk()).toBe(true);

            const updated = await container
                .resolve(UpdateApiKeyUseCase)
                .execute(created.value!.id, { name: "Renamed" });
            expect(updated.isOk()).toBe(true);
        });

        it("refuses to create an API key without full access", async () => {
            signInWith(LIMITED_PERMISSIONS);

            const result = await container.resolve(CreateApiKeyUseCase).execute(input);

            expect(result.isFail()).toBe(true);
            expect(result.error?.code).toBe("ApiKey/NotAuthorized");
        });

        it("refuses to update an API key without full access", async () => {
            const created = await container.resolve(CreateApiKeyUseCase).execute(input);
            expect(created.isOk()).toBe(true);

            signInWith(LIMITED_PERMISSIONS);
            const result = await container
                .resolve(UpdateApiKeyUseCase)
                .execute(created.value!.id, { permissions: [{ name: "*" }] });

            expect(result.isFail()).toBe(true);
            expect(result.error?.code).toBe("ApiKey/NotAuthorized");
        });

        it("code running without authorization may create an API key", async () => {
            signInWith([]);

            const result = await asSystem(() =>
                container.resolve(CreateApiKeyUseCase).execute(input)
            );

            expect(result.isOk()).toBe(true);
        });

        it("returns API keys without tokens to callers without full access", async () => {
            const created = await container
                .resolve(CreateApiKeyUseCase)
                .execute({ ...input, permissions: [{ name: "*" }] });
            expect(created.isOk()).toBe(true);
            const { id, token } = created.value!;
            expect(token).toMatch(/^wat_/);

            signInWith(LIMITED_PERMISSIONS);

            const list = await container.resolve(ListApiKeysUseCase).execute();
            expect(list.isOk()).toBe(true);
            expect(list.value).toHaveLength(1);
            expect(list.value![0]).toMatchObject({ id, slug: "key", token: null });

            const get = await container.resolve(GetApiKeyUseCase).execute(id);
            expect(get.isOk()).toBe(true);
            expect(get.value).toMatchObject({ id, slug: "key", token: null });

            // Authentication by token still resolves the key, with its token.
            const byToken = await container.resolve(GetApiKeyByTokenUseCase).execute(token);
            expect(byToken.isOk()).toBe(true);
            expect(byToken.value).toMatchObject({ id, token });

            // Hiding the token must not leak into later reads by full access.
            signInWith([{ name: "*" }]);
            const fullList = await container.resolve(ListApiKeysUseCase).execute();
            expect(fullList.value![0].token).toBe(token);
        });

        it("returns API keys with tokens to full access and code running without authorization", async () => {
            const created = await container.resolve(CreateApiKeyUseCase).execute(input);
            expect(created.isOk()).toBe(true);
            const { id, token } = created.value!;

            const list = await container.resolve(ListApiKeysUseCase).execute();
            expect(list.value).toMatchObject([{ id, token }]);

            const get = await container.resolve(GetApiKeyUseCase).execute(id);
            expect(get.value).toMatchObject({ id, token });

            signInWith([]);
            const systemGet = await asSystem(() => container.resolve(GetApiKeyUseCase).execute(id));
            expect(systemGet.value).toMatchObject({ id, token });
        });
    });

    describe("roles", () => {
        it("lets the caller create a role with permissions they hold", async () => {
            signInWith(LIMITED_PERMISSIONS);

            const result = await container.resolve(CreateRoleUseCase).execute({
                name: "Files reader",
                slug: "files-reader",
                description: "",
                permissions: [{ name: "fm.file", rwd: "r" }]
            });

            expect(result.isOk()).toBe(true);
        });

        it("refuses to create a role with more than the caller holds", async () => {
            signInWith(LIMITED_PERMISSIONS);

            for (const permissions of [
                [{ name: "*" }],
                [{ name: "fm.file", rwd: "rwd" }],
                [{ name: "fm.file" }],
                [{ name: "cms.contentEntry", rwd: "r" }]
            ]) {
                const result = await container.resolve(CreateRoleUseCase).execute({
                    name: "Escalation",
                    slug: "escalation",
                    description: "",
                    permissions
                });

                expect(result.isFail()).toBe(true);
                expect(result.error?.code).toBe("NOT_AUTHORIZED");
            }
        });

        it("refuses to give a role more than the caller holds", async () => {
            const role = await createRole("files-reader", [{ name: "fm.file", rwd: "r" }]);
            signInWith(LIMITED_PERMISSIONS);

            const result = await container
                .resolve(UpdateRoleUseCase)
                .execute(role.id, { permissions: [{ name: "*" }] });

            expect(result.isFail()).toBe(true);
            expect(result.error?.code).toBe("NOT_AUTHORIZED");

            const allowed = await container
                .resolve(UpdateRoleUseCase)
                .execute(role.id, { permissions: [{ name: "fm.file", rwd: "rw" }] });
            expect(allowed.isOk()).toBe(true);
        });

        it("refuses to update a role that has more than the caller holds", async () => {
            const role = await createRole("admins", [{ name: "security.*" }]);
            signInWith(LIMITED_PERMISSIONS);

            const result = await container
                .resolve(UpdateRoleUseCase)
                .execute(role.id, { permissions: [] });

            expect(result.isFail()).toBe(true);
            expect(result.error?.code).toBe("NOT_AUTHORIZED");
        });

        it("refuses to update or delete a system role", async () => {
            const role = await createRole("full-access", [{ name: "*" }], true);

            const updated = await container
                .resolve(UpdateRoleUseCase)
                .execute(role.id, { name: "Renamed" });
            expect(updated.isFail()).toBe(true);
            expect(updated.error?.code).toBe("CANNOT_UPDATE_SYSTEM_ROLES");

            const deleted = await container.resolve(DeleteRoleUseCase).execute(role.id);
            expect(deleted.isFail()).toBe(true);
            expect(deleted.error?.code).toBe("CANNOT_DELETE_SYSTEM_ROLES");
        });

        it("code running without authorization may delete a system role (installer rollback)", async () => {
            const role = await createRole("full-access", [{ name: "*" }], true);

            const deleted = await asSystem(() =>
                container.resolve(DeleteRoleUseCase).execute(role.id)
            );

            expect(deleted.isOk()).toBe(true);
        });

        it("caches roles per tenant", async () => {
            const role = await createRole("files-reader", [{ name: "fm.file", rwd: "r" }]);
            const repository = container.resolve(RolesRepository);

            const inRoot = await repository.get({ id: role.id });
            expect(inRoot.isOk()).toBe(true);

            const acme = { id: "acme", name: "Acme", parent: "root" } as Tenant;
            const inAcme = await container
                .resolve(TenantContext)
                .withTenant(acme, () => repository.get({ id: role.id }));
            expect(inAcme.isFail()).toBe(true);

            const bySlugInAcme = await container
                .resolve(TenantContext)
                .withTenant(acme, () => repository.get({ slug: "files-reader" }));
            expect(bySlugInAcme.isFail()).toBe(true);
        });
    });

    describe("teams", () => {
        const createTeam = (roles: string[]) => {
            return container.resolve(CreateTeam).execute({
                name: "Team",
                slug: "team",
                description: "",
                roles
            });
        };

        it("lets the caller create a team with roles they could grant", async () => {
            const role = await createRole("files-reader", [{ name: "fm.file", rwd: "r" }]);
            signInWith(LIMITED_PERMISSIONS);

            const result = await createTeam([role.id]);

            expect(result.isOk()).toBe(true);
        });

        it("refuses to create a team with a role that has more than the caller holds", async () => {
            const fullAccess = await createRole("full-access", [{ name: "*" }], true);
            signInWith(LIMITED_PERMISSIONS);

            const result = await createTeam([fullAccess.id]);

            expect(result.isFail()).toBe(true);
            expect(result.error?.code).toBe("NOT_AUTHORIZED");
        });

        it("refuses to add a role that has more than the caller holds to a team", async () => {
            const fullAccess = await createRole("full-access", [{ name: "*" }], true);
            const team = await createTeam([]);
            expect(team.isOk()).toBe(true);
            signInWith(LIMITED_PERMISSIONS);

            const result = await container
                .resolve(UpdateTeam)
                .execute(team.value!.id, { roles: [fullAccess.id] });

            expect(result.isFail()).toBe(true);
            expect(result.error?.code).toBe("NOT_AUTHORIZED");
        });
    });

    describe("users", () => {
        const userInput = (email: string, roles: string[] = [], teams: string[] = []) => ({
            email,
            firstName: "Test",
            lastName: "User",
            roles,
            teams
        });

        it("lets the caller assign a role with permissions they hold", async () => {
            const role = await createRole("files-reader", [{ name: "fm.file", rwd: "r" }]);
            signInWith(LIMITED_PERMISSIONS);

            const result = await container
                .resolve(CreateUserUseCase)
                .execute(userInput("reader@example.com", [role.id]));

            expect(result.isOk()).toBe(true);
        });

        it("refuses to assign a role with more than the caller holds", async () => {
            const fullAccess = await createRole("full-access", [{ name: "*" }], true);
            signInWith(LIMITED_PERMISSIONS);

            const created = await container
                .resolve(CreateUserUseCase)
                .execute(userInput("admin@example.com", [fullAccess.id]));
            expect(created.isFail()).toBe(true);
            expect(created.error?.code).toBe("AdminUser/NotAuthorized");
        });

        it("refuses to assign a team whose roles have more than the caller holds", async () => {
            const fullAccess = await createRole("full-access", [{ name: "*" }], true);
            const team = await asSystem(() =>
                container.resolve(CreateTeam).execute({
                    name: "Admins",
                    slug: "admins",
                    description: "",
                    roles: [fullAccess.id]
                })
            );
            expect(team.isOk()).toBe(true);
            signInWith(LIMITED_PERMISSIONS);

            const created = await container
                .resolve(CreateUserUseCase)
                .execute(userInput("admin@example.com", [], [team.value!.id]));

            expect(created.isFail()).toBe(true);
            expect(created.error?.code).toBe("AdminUser/NotAuthorized");
        });

        it("refuses to give an existing user a role with more than the caller holds", async () => {
            const fullAccess = await createRole("full-access", [{ name: "*" }], true);
            const user = await container
                .resolve(CreateUserUseCase)
                .execute(userInput("user@example.com"));
            expect(user.isOk()).toBe(true);
            signInWith(LIMITED_PERMISSIONS);

            const result = await container
                .resolve(UpdateUserUseCase)
                .execute(user.value!.id, { roles: [fullAccess.id] });

            expect(result.isFail()).toBe(true);
            expect(result.error?.code).toBe("AdminUser/NotAuthorized");
        });

        it("refuses to manage a user who has more than the caller holds", async () => {
            const fullAccess = await createRole("full-access", [{ name: "*" }], true);
            const admin = await container
                .resolve(CreateUserUseCase)
                .execute(userInput("admin@example.com", [fullAccess.id]));
            expect(admin.isOk()).toBe(true);
            signInWith(LIMITED_PERMISSIONS);

            const result = await container
                .resolve(UpdateUserUseCase)
                .execute(admin.value!.id, { firstName: "Renamed", roles: [] });

            expect(result.isFail()).toBe(true);
            expect(result.error?.code).toBe("AdminUser/NotAuthorized");
        });

        it("refuses to delete a user who has more than the caller holds", async () => {
            const fullAccess = await createRole("full-access", [{ name: "*" }], true);
            const admin = await container
                .resolve(CreateUserUseCase)
                .execute(userInput("admin@example.com", [fullAccess.id]));
            expect(admin.isOk()).toBe(true);
            signInWith(LIMITED_PERMISSIONS);

            const result = await container.resolve(DeleteUserUseCase).execute(admin.value!.id);

            expect(result.isFail()).toBe(true);
            expect(result.error?.code).toBe("AdminUser/NotAuthorized");
        });

        it("lets the caller delete a user whose roles they could assign", async () => {
            const files = await createRole("files", [{ name: "fm.file", rwd: "r" }]);
            const user = await container
                .resolve(CreateUserUseCase)
                .execute(userInput("user@example.com", [files.id]));
            expect(user.isOk()).toBe(true);
            signInWith(LIMITED_PERMISSIONS);

            const result = await container.resolve(DeleteUserUseCase).execute(user.value!.id);

            expect(result.isOk()).toBe(true);
        });

        it("full access may assign any role", async () => {
            const fullAccess = await createRole("full-access", [{ name: "*" }], true);

            const result = await container
                .resolve(CreateUserUseCase)
                .execute(userInput("admin@example.com", [fullAccess.id]));

            expect(result.isOk()).toBe(true);
        });
    });
});

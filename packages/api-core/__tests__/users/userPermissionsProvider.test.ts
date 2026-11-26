import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { UserPermissionsProvider } from "~/features/users/UserPermissionsProvider/index.js";
import { UserPermissionsProviderFeature } from "~/features/users/UserPermissionsProvider/feature.js";
import { AdminUsersRepository } from "~/features/users/shared/abstractions.js";
import { RolesRepository } from "~/features/security/roles/shared/abstractions.js";
import { TeamsRepository } from "~/features/security/teams/shared/abstractions.js";
import { RoleStorageError } from "~/features/security/roles/shared/errors.js";
import { WcpContext } from "~/features/wcp/WcpContext/index.js";
import { PermissionTransformer } from "~/features/security/authorization/AuthorizationContext/abstractions.js";
import type { AdminUser } from "~/features/users/shared/types.js";
import type { Role } from "~/types/security.js";
import type { Team } from "~/types/security.js";

const createRole = (id: string, permissions: Role["permissions"]): Role => {
    return {
        id,
        slug: id,
        name: id,
        description: "",
        system: false,
        permissions,
        createdOn: null,
        createdBy: null
    };
};

const createUser = (id: string, roles: string[], teams: string[] = []): AdminUser => {
    return {
        id,
        displayName: id,
        email: `${id}@webiny.local`,
        roles,
        teams,
        tenant: "root",
        createdOn: new Date().toISOString(),
        createdBy: null
    };
};

const team: Team = {
    id: "editors",
    slug: "editors",
    name: "Editors",
    description: "",
    system: false,
    roles: ["cmsRead"],
    createdOn: null,
    createdBy: null
};

const roles = [
    createRole("cmsRead", [{ name: "cms.contentEntry", rwd: "r" }]),
    createRole("custom", [{ name: "myApp.thing" }])
];

const users = [createUser("ann", ["cmsRead"]), createUser("bob", [], ["editors"])];

interface SetupParams {
    aacl?: boolean;
    teams?: boolean;
    rolesFail?: boolean;
    transformers?: PermissionTransformer.Interface[];
}

const setup = (params: SetupParams = {}) => {
    const container = new Container();

    container.registerInstance(WcpContext, {
        canUseAacl: () => params.aacl ?? true,
        canUseTeams: () => params.teams ?? true
    } as unknown as WcpContext.Interface);

    container.registerInstance(AdminUsersRepository, {
        list: async () => Result.ok(users)
    } as unknown as AdminUsersRepository.Interface);

    container.registerInstance(RolesRepository, {
        list: async () => {
            if (params.rolesFail) {
                return Result.fail(new RoleStorageError(new Error("Roles table unavailable.")));
            }
            return Result.ok(roles);
        }
    } as unknown as RolesRepository.Interface);

    container.registerInstance(TeamsRepository, {
        list: async () => Result.ok([team])
    } as unknown as TeamsRepository.Interface);

    for (const transformer of params.transformers ?? []) {
        container.registerInstance(PermissionTransformer, transformer);
    }

    UserPermissionsProviderFeature.register(container);

    return container.resolve(UserPermissionsProvider);
};

const getPermissionNames = (items: UserPermissionsProvider.Item[], userId: string) => {
    const item = items.find(item => item.user.id === userId);
    return item?.permissions.map(permission => permission.name);
};

describe("UserPermissionsProvider", () => {
    it("gives each user the permissions of their roles and their teams' roles", async () => {
        const provider = setup();

        const result = await provider.listUsersWithPermissions();

        expect(result.isOk()).toBe(true);
        expect(getPermissionNames(result.value, "ann")).toEqual(["cms.contentEntry", "aacl"]);
        expect(getPermissionNames(result.value, "bob")).toEqual(["cms.contentEntry", "aacl"]);
    });

    it("ignores team roles when teams are not enabled", async () => {
        const provider = setup({ teams: false });

        const result = await provider.listUsersWithPermissions();

        expect(getPermissionNames(result.value, "bob")).toEqual(["aacl"]);
    });

    it("drops granular Webiny app permissions without AACL", async () => {
        const provider = setup({ aacl: false });

        const result = await provider.listUsersWithPermissions();

        expect(getPermissionNames(result.value, "ann")).toEqual([]);
    });

    it("applies the permission transformers and removes duplicates", async () => {
        const transformer: PermissionTransformer.Interface = {
            execute: permission => [permission, { name: "added.by.transformer" }]
        };
        const provider = setup({ transformers: [transformer, transformer] });

        const result = await provider.listUsersWithPermissions();

        expect(getPermissionNames(result.value, "ann")).toEqual([
            "cms.contentEntry",
            "added.by.transformer",
            "aacl"
        ]);
    });

    it("fails when the roles cannot be loaded, instead of returning users without permissions", async () => {
        const provider = setup({ rolesFail: true });

        const result = await provider.listUsersWithPermissions();

        expect(result.isFail()).toBe(true);
        expect(result.error).toBeInstanceOf(RoleStorageError);
    });
});

import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { FeatureFlags as FeatureFlagsClass } from "@webiny/feature-flags";
import { FeatureFlags } from "~/features/featureFlags/abstractions.js";
import { RawAssumedRole } from "~/features/requestContext/abstractions.js";
import { RolesRepository } from "~/features/security/roles/shared/abstractions.js";
import { TeamsRepository } from "~/features/security/teams/shared/abstractions.js";
import { PermissionsProcessor } from "~/features/security/authorization/GroupsTeamsAuthorizer/abstractions.js";
import { AssumedRolePermissions } from "~/features/security/authorization/GroupsTeamsAuthorizer/AssumedRolePermissions.js";
import { GroupsTeamsAuthorizerFeature } from "~/features/security/authorization/GroupsTeamsAuthorizer/feature.js";
import { RequestContextFeature } from "~/features/requestContext/feature.js";
import { AdminUsersRepository } from "~/features/users/shared/abstractions.js";
import type { Identity } from "~/features/security/IdentityContext/index.js";
import type { Role } from "~/types/security.js";
import type { Team } from "~/types/security.js";

const identity = { id: "u1", type: "admin" } as unknown as Identity;

const role = (id: string, permissions: Array<{ name: string }>): Role => {
    return {
        id,
        name: id,
        slug: id,
        description: "",
        system: false,
        createdOn: null,
        createdBy: null,
        permissions
    };
};

interface SetupOptions {
    // What the caller's own roles grant. `null` means "no roles found at all".
    own: Array<{ name: string }> | null;
    assumed?: RawAssumedRole.Request | null;
    roles?: Role[];
    teams?: Team[];
    teamsEnabled?: boolean;
}

const processorFor = (options: SetupOptions) => {
    const { own, assumed = null, roles = [], teams = [], teamsEnabled = true } = options;
    const container = new Container();

    container.registerInstance(PermissionsProcessor, {
        getPermissions: async () => {
            if (own === null) {
                return null;
            }
            return own.map(permission => ({ ...permission, _src: "role:own" }));
        }
    });

    container.registerInstance(RawAssumedRole, {
        get: () => assumed,
        set: () => undefined
    });

    container.registerInstance(FeatureFlags, {
        get: () => new FeatureFlagsClass({ advancedAccessControlLayer: { teams: teamsEnabled } })
    });

    container.registerInstance(RolesRepository, {
        list: async (params: { where?: { id_in?: string[] } }) => {
            const requested = params.where?.id_in ?? [];
            const found = roles.filter(item => requested.includes(item.id));
            return Result.ok(found);
        }
    } as never);

    container.registerInstance(TeamsRepository, {
        get: async (params: { id?: string }) => {
            const found = teams.find(item => item.id === params.id);
            if (!found) {
                return Result.fail(new Error("Team not found.") as never);
            }
            return Result.ok(found);
        }
    } as never);

    container.registerDecorator(AssumedRolePermissions);

    return container.resolve(PermissionsProcessor);
};

const names = (permissions: PermissionsProcessor.Permissions | null) => {
    return (permissions ?? []).map(permission => permission.name);
};

describe("AssumedRolePermissions", () => {
    it("passes the caller's own permissions through when no role is assumed", async () => {
        const processor = processorFor({ own: [{ name: "*" }] });

        const permissions = await processor.getPermissions(identity);

        expect(names(permissions)).toEqual(["*"]);
    });

    it("passes null through when the caller has no roles at all", async () => {
        const processor = processorFor({
            own: null,
            assumed: { type: "role", id: "editor" }
        });

        const permissions = await processor.getPermissions(identity);

        expect(permissions).toBeNull();
    });

    it("substitutes the assumed role for a caller with full access", async () => {
        const processor = processorFor({
            own: [{ name: "*" }],
            assumed: { type: "role", id: "editor" },
            roles: [role("editor", [{ name: "cms.contentEntry" }])]
        });

        const permissions = await processor.getPermissions(identity);

        expect(names(permissions)).toEqual(["cms.contentEntry"]);
    });

    /*
     * The whole security surface of the feature. A caller who cannot already do everything must not
     * be able to acquire anything by asking to preview a role.
     */
    it("ignores the assumed role when the caller does not have full access", async () => {
        const processor = processorFor({
            own: [{ name: "cms.contentEntry" }],
            assumed: { type: "role", id: "admin" },
            roles: [role("admin", [{ name: "*" }])]
        });

        const permissions = await processor.getPermissions(identity);

        expect(names(permissions)).toEqual(["cms.contentEntry"]);
    });

    it("grants nothing when the assumed role does not exist", async () => {
        const processor = processorFor({
            own: [{ name: "*" }],
            assumed: { type: "role", id: "missing" },
            roles: [role("editor", [{ name: "cms.contentEntry" }])]
        });

        const permissions = await processor.getPermissions(identity);

        expect(names(permissions)).toEqual([]);
    });

    it("assumes a team as the union of its roles", async () => {
        const team: Team = {
            id: "editors",
            name: "Editors",
            slug: "editors",
            description: "",
            system: false,
            createdOn: null,
            createdBy: null,
            roles: ["editor", "reviewer"]
        };

        const processor = processorFor({
            own: [{ name: "*" }],
            assumed: { type: "team", id: "editors" },
            teams: [team],
            roles: [
                role("editor", [{ name: "cms.contentEntry" }]),
                role("reviewer", [{ name: "cms.contentModel" }])
            ]
        });

        const permissions = await processor.getPermissions(identity);

        expect(names(permissions)).toEqual(["cms.contentEntry", "cms.contentModel"]);
    });

    /*
     * The tests above register the decorator themselves, which proves the logic but not that
     * anything registers it in production. ApiCoreFeature registers SecurityFeature (and with it
     * this decorator) BEFORE RequestContextFeature registers the holder it depends on, so this
     * pins down that the order works.
     */
    it("resolves through the container in the order ApiCoreFeature registers it", async () => {
        const container = new Container();

        GroupsTeamsAuthorizerFeature.register(container);
        RequestContextFeature.register(container);

        container.registerInstance(FeatureFlags, {
            get: () => new FeatureFlagsClass({})
        });

        container.registerInstance(AdminUsersRepository, {
            get: async () => Result.ok({ id: "u1", roles: ["admin"], teams: [] })
        } as never);

        container.registerInstance(RolesRepository, {
            list: async (params: { where?: { id_in?: string[] } }) => {
                const requested = params.where?.id_in ?? [];
                const all = [role("admin", [{ name: "*" }]), role("editor", [{ name: "cms.*" }])];
                return Result.ok(all.filter(item => requested.includes(item.id)));
            }
        } as never);

        container.registerInstance(TeamsRepository, {
            get: async () => Result.fail(new Error("Team not found.") as never)
        } as never);

        const rawAssumedRole = container.resolve(RawAssumedRole);
        rawAssumedRole.set({ type: "role", id: "editor" });

        const processor = container.resolve(PermissionsProcessor);
        const permissions = await processor.getPermissions(identity);

        expect(names(permissions)).toEqual(["cms.*"]);
    });

    it("grants nothing when a team is assumed but teams are disabled", async () => {
        const team: Team = {
            id: "editors",
            name: "Editors",
            slug: "editors",
            description: "",
            system: false,
            createdOn: null,
            createdBy: null,
            roles: ["editor"]
        };

        const processor = processorFor({
            own: [{ name: "*" }],
            assumed: { type: "team", id: "editors" },
            teams: [team],
            roles: [role("editor", [{ name: "cms.contentEntry" }])],
            teamsEnabled: false
        });

        const permissions = await processor.getPermissions(identity);

        expect(names(permissions)).toEqual([]);
    });
});

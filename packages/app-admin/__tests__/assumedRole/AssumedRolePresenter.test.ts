import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { Identity } from "~/domain/Identity.js";
import { IdentityContext } from "~/features/security/IdentityContext/abstractions.js";
import { IdentityContext as IdentityContextImpl } from "~/features/security/IdentityContext/IdentityContext.js";
import { FeatureFlagsService } from "~/features/featureFlags/abstractions.js";
import { AssumedRoleContext } from "~/features/assumedRole/abstractions.js";
import { AssumeRoleUseCase } from "~/features/assumedRole/abstractions.js";
import { ListAssumableRolesGateway } from "~/features/assumedRole/abstractions.js";
import { ListAssumableRolesUseCase } from "~/features/assumedRole/ListAssumableRolesUseCase.js";
import { AssumedRolePresenter as PresenterAbstraction } from "~/presentation/assumedRole/abstractions.js";
import { AssumedRolePresenter } from "~/presentation/assumedRole/AssumedRolePresenter.js";

type Dto = ListAssumableRolesGateway.Dto;

interface SetupOptions {
    dto: Dto;
    teamsEnabled?: boolean;
    ownRoleIds?: string[];
    ownTeamIds?: string[];
}

const setup = (options: SetupOptions) => {
    const { dto, teamsEnabled = true, ownRoleIds = [], ownTeamIds = [] } = options;
    const calls: Array<{ includeTeams: boolean }> = [];
    const container = new Container();

    container.register(IdentityContextImpl).inSingletonScope();
    container.resolve(IdentityContext).setIdentity(
        Identity.createAuthenticated({
            id: "u1",
            displayName: "Admin",
            type: "admin",
            roles: ownRoleIds.map(id => ({ id, slug: id, name: id })),
            teams: ownTeamIds.map(id => ({ id, slug: id, name: id })),
            permissions: [{ name: "*" }],
            profile: { external: false },
            currentTenant: { id: "root", name: "Root" },
            defaultTenant: { id: "root", name: "Root" }
        })
    );

    container.registerInstance(AssumedRoleContext, {
        get: () => null,
        set: () => undefined
    });
    container.registerInstance(AssumeRoleUseCase, { execute: async () => undefined });
    container.registerInstance(FeatureFlagsService, {
        getFlags: () => ({ isEnabled: () => teamsEnabled }),
        isLoaded: () => true,
        loadFlags: async () => undefined
    } as never);
    container.registerInstance(ListAssumableRolesGateway, {
        execute: async (params: { includeTeams: boolean }) => {
            calls.push(params);
            return dto;
        }
    });
    container.register(ListAssumableRolesUseCase);
    container.register(AssumedRolePresenter).inSingletonScope();

    return { presenter: container.resolve(PresenterAbstraction), calls };
};

const role = (id: string, permissions: Array<{ name: string; [key: string]: unknown }>) => ({
    id,
    name: id,
    description: null,
    permissions
});

const optionFor = async (permissions: Array<{ name: string; [key: string]: unknown }>) => {
    const { presenter } = setup({ dto: { roles: [role("r", permissions)], teams: [] } });
    await presenter.load();
    return presenter.vm.roleOptions[0];
};

describe("AssumedRolePresenter", () => {
    describe("read-only label", () => {
        /*
         * The label tells someone a role is harmless, so every way a permission can write has to
         * rule it out. A false "Read-only" is worse than a missing one.
         */
        it("marks a role that only reads", async () => {
            const option = await optionFor([
                { name: "content.i18n" },
                { name: "cms.endpoint.manage" },
                { name: "cms.contentModel", rwd: "r" },
                { name: "cms.contentEntry", rwd: "r" }
            ]);

            expect(option.readOnly).toBe(true);
        });

        it.each([
            ["write access", { name: "cms.contentEntry", rwd: "rw" }],
            ["delete access", { name: "cms.contentEntry", rwd: "rd" }],
            ["publishing", { name: "cms.contentEntry", rwd: "r", pw: "p" }],
            ["own-record scoping", { name: "cms.contentEntry", rwd: "r", own: true }],
            ["an app-wide grant", { name: "cms.*" }],
            ["full access", { name: "*" }]
        ])("does not mark a role that has %s", async (_label, permission) => {
            const option = await optionFor([{ name: "cms.contentModel", rwd: "r" }, permission]);

            expect(option.readOnly).toBe(false);
        });

        it("does not mark a role that grants nothing readable", async () => {
            const option = await optionFor([{ name: "content.i18n" }]);

            expect(option.readOnly).toBe(false);
        });
    });

    it("flags full access", async () => {
        const option = await optionFor([{ name: "*" }]);

        expect(option.fullAccess).toBe(true);
    });

    it("marks the signed-in user's own role and team", async () => {
        const { presenter } = setup({
            dto: {
                roles: [role("editor", []), role("admin", [{ name: "*" }])],
                teams: [{ id: "marketing", name: "Marketing", description: null, roles: [] }]
            },
            ownRoleIds: ["admin"],
            ownTeamIds: ["marketing"]
        });

        await presenter.load();

        const current = presenter.vm.roleOptions.map(option => [option.label, option.isCurrent]);
        expect(current).toEqual([
            ["editor", false],
            ["admin", true]
        ]);
        expect(presenter.vm.teamOptions[0].isCurrent).toBe(true);
    });

    it("gives a team the union of its roles' permissions", async () => {
        const { presenter } = setup({
            dto: {
                roles: [
                    role("reader", [{ name: "cms.contentEntry", rwd: "r" }]),
                    role("writer", [{ name: "wb.page", rwd: "rw" }]),
                    role("unrelated", [{ name: "fm.file", rwd: "rwd" }])
                ],
                teams: [
                    {
                        id: "editorial",
                        name: "Editorial",
                        description: null,
                        roles: [{ id: "reader" }, { id: "writer" }]
                    }
                ]
            }
        });

        await presenter.load();

        const team = presenter.vm.teamOptions[0];
        expect(team.permissionNames).toEqual(["cms.contentEntry", "wb.page"]);
        // The writer role's permission is enough to rule out read-only.
        expect(team.readOnly).toBe(false);
    });

    it("does not ask for teams when teams are disabled", async () => {
        const { presenter, calls } = setup({
            dto: { roles: [], teams: [] },
            teamsEnabled: false
        });

        await presenter.load();

        expect(calls).toEqual([{ includeTeams: false }]);
    });
});

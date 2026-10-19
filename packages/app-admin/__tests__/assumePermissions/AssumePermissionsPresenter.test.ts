import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { Container } from "@webiny/di";
import { Identity } from "~/domain/Identity.js";
import { IdentityContext } from "~/features/security/IdentityContext/abstractions.js";
import { IdentityContext as IdentityContextImpl } from "~/features/security/IdentityContext/IdentityContext.js";
import { FeatureFlagsService } from "~/features/featureFlags/abstractions.js";
import { AssumePermissionsContext } from "~/features/assumePermissions/abstractions.js";
import { AssumePermissionsUseCase } from "~/features/assumePermissions/abstractions.js";
import { ListAssumableTargetsGateway } from "~/features/assumePermissions/abstractions.js";
import { ListAssumableTargetsUseCase } from "~/features/assumePermissions/ListAssumableTargetsUseCase.js";
import { AssumePermissionsPresenter as PresenterAbstraction } from "~/presentation/assumePermissions/abstractions.js";
import { AssumePermissionsPresenter } from "~/presentation/assumePermissions/AssumePermissionsPresenter.js";

type Dto = ListAssumableTargetsGateway.Dto;

interface SetupOptions {
    dto: Dto;
    teamsEnabled?: boolean;
    ownPermissions?: Array<{ name: string }>;
    assumeError?: Error;
}

const setup = (options: SetupOptions) => {
    const { dto, teamsEnabled = true, ownPermissions = [{ name: "*" }], assumeError } = options;
    const calls: Array<{ includeTeams: boolean }> = [];
    const previewed: Array<AssumePermissionsUseCase.Target | null> = [];
    const passedOptions: Array<AssumePermissionsUseCase.Options | undefined> = [];
    const container = new Container();

    container.register(IdentityContextImpl).inSingletonScope();
    const identity = Identity.createAuthenticated({
        id: "u1",
        displayName: "Admin",
        type: "admin",
        roles: [],
        teams: [],
        permissions: ownPermissions,
        profile: { external: false },
        currentTenant: { id: "root", name: "Root" },
        defaultTenant: { id: "root", name: "Root" }
    });
    const identityContext = container.resolve(IdentityContext);
    identityContext.setIdentity(identity);

    container.registerInstance(AssumePermissionsContext, {
        get: () => null,
        set: () => undefined
    });
    container.registerInstance(AssumePermissionsUseCase, {
        execute: async (
            target: AssumePermissionsUseCase.Target | null,
            passed?: AssumePermissionsUseCase.Options
        ) => {
            previewed.push(target);
            passedOptions.push(passed);
            if (assumeError) {
                throw assumeError;
            }
        }
    });
    container.registerInstance(FeatureFlagsService, {
        getFlags: () => ({ isEnabled: () => teamsEnabled }),
        isLoaded: () => true,
        loadFlags: async () => undefined
    } as never);
    container.registerInstance(ListAssumableTargetsGateway, {
        execute: async (params: { includeTeams: boolean }) => {
            calls.push(params);
            return dto;
        }
    });
    container.register(ListAssumableTargetsUseCase);
    container.register(AssumePermissionsPresenter).inSingletonScope();

    return { presenter: container.resolve(PresenterAbstraction), calls, previewed, passedOptions };
};

describe("AssumePermissionsPresenter", () => {
    it("lists roles and teams by name, keyed by type and id", async () => {
        const { presenter } = setup({
            dto: {
                roles: [{ id: "r1", name: "Editor" }],
                teams: [{ id: "t1", name: "Marketing" }]
            }
        });

        await presenter.load();

        expect(presenter.vm.roleOptions).toEqual([{ value: "role:r1", label: "Editor" }]);
        expect(presenter.vm.teamOptions).toEqual([{ value: "team:t1", label: "Marketing" }]);
    });

    /*
     * The header control picks by option value. Success reloads the page, so this goes through
     * the failure path to see what reached the use case.
     */
    it("previews the option picked by value", async () => {
        const { presenter, previewed } = setup({
            dto: { roles: [], teams: [{ id: "t1", name: "Marketing" }] },
            assumeError: new Error("Nope.")
        });

        await presenter.load();
        await presenter.assume("team:t1");

        expect(previewed).toEqual([{ type: "team", id: "t1", name: "Marketing" }]);
    });

    // Mid-preview, from the header control: the use case keeps the page the first preview began on.
    it("records no page when switching from the header control", async () => {
        const { presenter, passedOptions } = setup({
            dto: { roles: [{ id: "r1", name: "Editor" }], teams: [] },
            assumeError: new Error("Nope.")
        });

        await presenter.load();
        await presenter.assume("role:r1");

        expect(passedOptions).toEqual([{}]);
    });

    it("does not ask for teams when teams are disabled", async () => {
        const { presenter, calls } = setup({
            dto: { roles: [], teams: [] },
            teamsEnabled: false
        });

        await presenter.load();

        expect(calls).toEqual([{ includeTeams: false }]);
    });

    describe("can assume", () => {
        it("allows a caller with full access", () => {
            const { presenter } = setup({ dto: { roles: [], teams: [] } });

            expect(presenter.vm.canAssume).toBe(true);
        });

        /*
         * The API ignores the header for anyone without full access, so offering them the action
         * would start a preview that changes nothing while the banner says it did.
         */
        it("refuses a caller without full access", () => {
            const { presenter } = setup({
                dto: { roles: [], teams: [] },
                ownPermissions: [{ name: "security.role" }]
            });

            expect(presenter.vm.canAssume).toBe(false);
        });
    });

    describe("assume target", () => {
        /*
         * Success reloads the page, so these go through the failure path. It still proves the
         * target reaches the use case, without the role list having been loaded first.
         */
        it("passes the target straight to the use case", async () => {
            const { presenter, previewed } = setup({
                dto: { roles: [], teams: [] },
                assumeError: new Error("Nope.")
            });

            await presenter.assumeTarget({ type: "team", id: "editorial", name: "Editorial" });

            expect(previewed).toEqual([{ type: "team", id: "editorial", name: "Editorial" }]);
        });

        it("records the page it was started from, so exiting can return there", async () => {
            window.history.pushState({}, "", "/access-management/roles?id=editor");
            const { presenter, passedOptions } = setup({
                dto: { roles: [], teams: [] },
                assumeError: new Error("Nope.")
            });

            await presenter.assumeTarget({ type: "role", id: "editor", name: "Editor" });

            expect(passedOptions).toEqual([{ returnTo: "/access-management/roles?id=editor" }]);
        });

        it("surfaces a failure and stops switching", async () => {
            const { presenter } = setup({
                dto: { roles: [], teams: [] },
                assumeError: new Error(`"Editor" grants no permissions on this tenant.`)
            });

            await presenter.assumeTarget({ type: "role", id: "editor", name: "Editor" });

            expect(presenter.vm.error).toBe(`"Editor" grants no permissions on this tenant.`);
            expect(presenter.vm.switching).toBe(false);
        });
    });
});

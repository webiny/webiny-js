import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { Container } from "@webiny/di";
import { Identity } from "~/domain/Identity.js";
import { IdentityContext } from "~/features/security/IdentityContext/abstractions.js";
import { IdentityContext as IdentityContextImpl } from "~/features/security/IdentityContext/IdentityContext.js";
import { FeatureFlagsService } from "~/features/featureFlags/abstractions.js";
import { PreviewContext } from "~/features/previewAs/abstractions.js";
import { PreviewAsUseCase } from "~/features/previewAs/abstractions.js";
import { ListPreviewCandidatesGateway } from "~/features/previewAs/abstractions.js";
import { ListPreviewCandidatesUseCase } from "~/features/previewAs/ListPreviewCandidatesUseCase.js";
import { PreviewPresenter as PresenterAbstraction } from "~/presentation/previewAs/abstractions.js";
import { PreviewPresenter } from "~/presentation/previewAs/PreviewPresenter.js";

type Dto = ListPreviewCandidatesGateway.Dto;

interface SetupOptions {
    dto: Dto;
    teamsEnabled?: boolean;
    ownPermissions?: Array<{ name: string }>;
    previewError?: Error;
}

const setup = (options: SetupOptions) => {
    const { dto, teamsEnabled = true, ownPermissions = [{ name: "*" }], previewError } = options;
    const calls: Array<{ includeTeams: boolean }> = [];
    const previewed: Array<PreviewAsUseCase.Target | null> = [];
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

    container.registerInstance(PreviewContext, {
        get: () => null,
        set: () => undefined
    });
    container.registerInstance(PreviewAsUseCase, {
        execute: async (target: PreviewAsUseCase.Target | null) => {
            previewed.push(target);
            if (previewError) {
                throw previewError;
            }
        }
    });
    container.registerInstance(FeatureFlagsService, {
        getFlags: () => ({ isEnabled: () => teamsEnabled }),
        isLoaded: () => true,
        loadFlags: async () => undefined
    } as never);
    container.registerInstance(ListPreviewCandidatesGateway, {
        execute: async (params: { includeTeams: boolean }) => {
            calls.push(params);
            return dto;
        }
    });
    container.register(ListPreviewCandidatesUseCase);
    container.register(PreviewPresenter).inSingletonScope();

    return { presenter: container.resolve(PresenterAbstraction), calls, previewed };
};

describe("PreviewPresenter", () => {
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
            previewError: new Error("Nope.")
        });

        await presenter.load();
        await presenter.previewAs("team:t1");

        expect(previewed).toEqual([{ type: "team", id: "t1", name: "Marketing" }]);
    });

    it("does not ask for teams when teams are disabled", async () => {
        const { presenter, calls } = setup({
            dto: { roles: [], teams: [] },
            teamsEnabled: false
        });

        await presenter.load();

        expect(calls).toEqual([{ includeTeams: false }]);
    });

    describe("can preview", () => {
        it("allows a caller with full access", () => {
            const { presenter } = setup({ dto: { roles: [], teams: [] } });

            expect(presenter.vm.canPreview).toBe(true);
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

            expect(presenter.vm.canPreview).toBe(false);
        });
    });

    describe("preview target", () => {
        /*
         * Success reloads the page, so these go through the failure path. It still proves the
         * target reaches the use case, without the role list having been loaded first.
         */
        it("passes the target straight to the use case", async () => {
            const { presenter, previewed } = setup({
                dto: { roles: [], teams: [] },
                previewError: new Error("Nope.")
            });

            await presenter.previewTarget({ type: "team", id: "editorial", name: "Editorial" });

            expect(previewed).toEqual([{ type: "team", id: "editorial", name: "Editorial" }]);
        });

        it("surfaces a failure and stops switching", async () => {
            const { presenter } = setup({
                dto: { roles: [], teams: [] },
                previewError: new Error(`"Editor" grants no permissions on this tenant.`)
            });

            await presenter.previewTarget({ type: "role", id: "editor", name: "Editor" });

            expect(presenter.vm.error).toBe(`"Editor" grants no permissions on this tenant.`);
            expect(presenter.vm.switching).toBe(false);
        });
    });
});

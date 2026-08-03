import { beforeEach, describe, expect, it } from "vitest";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import { CANONICAL_SLOTS } from "@webiny/theme-common";
import { useHandler } from "./utils/useHandler.js";
import { themeMocks } from "./mocks/theme.mock.js";
import { CreateThemeUseCase } from "~/features/CreateTheme/index.js";
import { GetThemeByIdUseCase } from "~/features/GetThemeById/index.js";
import { ListThemesUseCase } from "~/features/ListThemes/index.js";
import { UpdateThemeUseCase } from "~/features/UpdateTheme/index.js";
import { DeleteThemeUseCase } from "~/features/DeleteTheme/index.js";
import { GetThemeRevisionsUseCase } from "~/features/GetThemeRevisions/index.js";
import { CreateThemeRevisionFromUseCase } from "~/features/CreateThemeRevisionFrom/index.js";
import { PublishThemeUseCase } from "~/features/PublishTheme/index.js";
import { ActivateThemeUseCase, DeactivateThemeUseCase } from "~/features/ActivateTheme/index.js";
import { GetActiveThemeUseCase } from "~/features/GetActiveTheme/index.js";

const unwrap = <T>(result: { isFail(): boolean; error?: unknown; value?: T }): T => {
    if (result.isFail()) {
        throw result.error;
    }
    return result.value as T;
};

describe("Theme lifecycle", () => {
    let context: ApiCoreContext;

    const createTheme = () => context.container.resolve(CreateThemeUseCase);
    const getTheme = () => context.container.resolve(GetThemeByIdUseCase);
    const listThemes = () => context.container.resolve(ListThemesUseCase);
    const updateTheme = () => context.container.resolve(UpdateThemeUseCase);
    const deleteTheme = () => context.container.resolve(DeleteThemeUseCase);
    const getRevisions = () => context.container.resolve(GetThemeRevisionsUseCase);
    const createRevisionFrom = () => context.container.resolve(CreateThemeRevisionFromUseCase);
    const publishTheme = () => context.container.resolve(PublishThemeUseCase);
    const activateTheme = () => context.container.resolve(ActivateThemeUseCase);
    const deactivateTheme = () => context.container.resolve(DeactivateThemeUseCase);
    const getActiveTheme = () => context.container.resolve(GetActiveThemeUseCase);

    beforeEach(async () => {
        context = await useHandler({}).handler();
    });

    describe("create", () => {
        it("creates a draft at version 1", async () => {
            const theme = unwrap(await createTheme().execute(themeMocks.blank));

            expect(theme).toMatchObject({
                id: expect.any(String),
                entryId: expect.any(String),
                version: 1,
                status: "draft",
                locked: false,
                resolved: null
            });
            expect(theme.properties.name).toBe("Northbeam 2026");
        });

        it("seeds every canonical slot, so the theme is never partially filled", async () => {
            const theme = unwrap(await createTheme().execute(themeMocks.blank));

            const missing = CANONICAL_SLOTS.filter(slot => {
                return (
                    slot.path
                        .split(".")
                        // oxlint-disable-next-line no-explicit-any
                        .reduce<any>((node, segment) => node?.[segment], theme.tokens)?.$value ===
                    undefined
                );
            });

            expect(missing.map(slot => slot.path)).toEqual([]);
        });

        it("seeds a permissive default policy", async () => {
            const theme = unwrap(await createTheme().execute(themeMocks.blank));

            expect(theme.policy).toMatchObject({
                color: { entry: "open" },
                fontSize: { entry: "open" },
                defaultMode: "system"
            });
        });

        it("refuses a theme with no name", async () => {
            const result = await createTheme().execute({ properties: { name: "  " } });

            expect(result.isFail()).toBe(true);
            if (result.isFail()) {
                expect(result.error.code).toBe("Theme/ValidationError");
            }
        });
    });

    describe("read", () => {
        it("reads a theme back by id", async () => {
            const created = unwrap(await createTheme().execute(themeMocks.blank));
            const found = unwrap(await getTheme().execute(created.id));

            expect(found.id).toBe(created.id);
            expect(found.properties.name).toBe("Northbeam 2026");
        });

        it("reports a missing theme as not found", async () => {
            const result = await getTheme().execute("does-not-exist#0001");

            expect(result.isFail()).toBe(true);
            if (result.isFail()) {
                expect(result.error.code).toBe("Theme/NotFound");
            }
        });

        it("lists the tenant's themes", async () => {
            await createTheme().execute(themeMocks.blank);
            await createTheme().execute(themeMocks.second);

            const { themes } = unwrap(await listThemes().execute());

            expect(themes.map(theme => theme.properties.name).sort()).toEqual([
                "Northbeam 2026",
                "Winter campaign"
            ]);
        });
    });

    describe("update", () => {
        it("updates one section without blanking the others", async () => {
            const created = unwrap(await createTheme().execute(themeMocks.blank));

            const updated = unwrap(
                await updateTheme().execute({
                    id: created.id,
                    data: { properties: { name: "Northbeam 2027" } }
                })
            );

            expect(updated.properties.name).toBe("Northbeam 2027");
            expect(updated.properties.description).toBe("Primary brand theme");
            expect(updated.tokens).toEqual(created.tokens);
            expect(updated.policy).toEqual(created.policy);
        });

        it("refuses to blank the name", async () => {
            const created = unwrap(await createTheme().execute(themeMocks.blank));

            const result = await updateTheme().execute({
                id: created.id,
                data: { properties: { name: "" } }
            });

            expect(result.isFail()).toBe(true);
            if (result.isFail()) {
                expect(result.error.code).toBe("Theme/ValidationError");
            }
        });
    });

    describe("publish", () => {
        it("publishes a valid draft and freezes the resolved snapshot", async () => {
            const created = unwrap(await createTheme().execute(themeMocks.blank));
            const { theme, warnings } = unwrap(await publishTheme().execute({ id: created.id }));

            expect(theme.status).toBe("published");
            expect(theme.locked).toBe(true);
            expect(warnings).toEqual([]);

            expect(theme.resolved).not.toBeNull();
            expect(theme.resolved?.schemaVersion).toBe(1);

            const page = theme.resolved?.modes.light.find(
                token => token.path === "color.surface.page"
            );
            expect(page?.value).toBe("#F8FAFC");
        });

        it("resolves the dark mode values too", async () => {
            const created = unwrap(await createTheme().execute(themeMocks.blank));
            const { theme } = unwrap(await publishTheme().execute({ id: created.id }));

            const page = theme.resolved?.modes.dark.find(
                token => token.path === "color.surface.page"
            );
            expect(page?.value).toBe("#0F172A");
        });

        it("blocks publishing when a reference does not resolve, and lists what to fix", async () => {
            const created = unwrap(await createTheme().execute(themeMocks.blank));

            const tokens = structuredClone(created.tokens);
            // oxlint-disable-next-line no-explicit-any
            (tokens.color as any).surface.page = { $value: "{color.brand.nope}" };
            await updateTheme().execute({ id: created.id, data: { tokens } });

            const result = await publishTheme().execute({ id: created.id });

            expect(result.isFail()).toBe(true);
            if (result.isFail()) {
                expect(result.error.code).toBe("Theme/NotPublishable");
                expect(result.error.data?.blockers?.[0].path).toBe("color.surface.page");
            }
        });

        it("publishes past an advisory contrast warning rather than blocking", async () => {
            const created = unwrap(await createTheme().execute(themeMocks.blank));

            const tokens = structuredClone(created.tokens);
            // oxlint-disable-next-line no-explicit-any
            (tokens.color as any).text.primary = { $value: "#BBBBBB" };
            await updateTheme().execute({ id: created.id, data: { tokens } });

            const { theme, warnings } = unwrap(await publishTheme().execute({ id: created.id }));

            expect(theme.status).toBe("published");
            expect(warnings.some(warning => warning.code === "A11y/Contrast")).toBe(true);
            expect(theme.resolved?.warnings.length).toBeGreaterThan(0);
        });
    });

    describe("revisions", () => {
        it("branches a new draft from a published version", async () => {
            const created = unwrap(await createTheme().execute(themeMocks.blank));
            unwrap(await publishTheme().execute({ id: created.id }));

            const draft = unwrap(await createRevisionFrom().execute({ id: created.id }));

            expect(draft.version).toBe(2);
            expect(draft.status).toBe("draft");
            expect(draft.locked).toBe(false);
            expect(draft.entryId).toBe(created.entryId);
            // The snapshot belongs to the version that was published, not to the branch.
            expect(draft.resolved).toBeNull();
        });

        it("lists the version history newest first", async () => {
            const created = unwrap(await createTheme().execute(themeMocks.blank));
            unwrap(await publishTheme().execute({ id: created.id }));
            unwrap(await createRevisionFrom().execute({ id: created.id }));

            const revisions = unwrap(await getRevisions().execute(created.entryId));

            expect(revisions.map(revision => revision.version)).toEqual([2, 1]);
            expect(revisions[1].status).toBe("published");
        });
    });

    describe("activate, rollback and deactivate", () => {
        it("starts with no active theme", async () => {
            const active = unwrap(await getActiveTheme().execute());

            expect(active.theme).toBeNull();
            expect(active.pointer).toBeNull();
        });

        it("activates a published version", async () => {
            const created = unwrap(await createTheme().execute(themeMocks.blank));
            unwrap(await publishTheme().execute({ id: created.id }));

            const result = unwrap(await activateTheme().execute({ id: created.id }));

            expect(result.pointer.id).toBe(created.id);
            expect(result.pointer.version).toBe(1);
            expect(result.previous).toBeNull();

            const active = unwrap(await getActiveTheme().execute());
            expect(active.theme?.id).toBe(created.id);
        });

        it("refuses to activate a version that has never been published", async () => {
            const created = unwrap(await createTheme().execute(themeMocks.blank));

            const result = await activateTheme().execute({ id: created.id });

            expect(result.isFail()).toBe(true);
            if (result.isFail()) {
                expect(result.error.code).toBe("Theme/NeverPublished");
            }
        });

        it("keeps an older version activatable after a newer one is published", async () => {
            // Publishing v2 flips v1's CMS status to `unpublished`. v1's frozen snapshot is
            // untouched, so it stays a valid rollback target — activation gates on the snapshot,
            // not on the CMS status.
            const created = unwrap(await createTheme().execute(themeMocks.blank));
            unwrap(await publishTheme().execute({ id: created.id }));

            const draft = unwrap(await createRevisionFrom().execute({ id: created.id }));
            unwrap(await publishTheme().execute({ id: draft.id }));

            const v1 = unwrap(await getTheme().execute(created.id));
            expect(v1.status).toBe("unpublished");
            expect(v1.resolved).not.toBeNull();

            const result = await activateTheme().execute({ id: created.id });
            expect(result.isFail()).toBe(false);
        });

        it("rolls back by activating an older published version", async () => {
            const created = unwrap(await createTheme().execute(themeMocks.blank));
            unwrap(await publishTheme().execute({ id: created.id }));
            unwrap(await activateTheme().execute({ id: created.id }));

            const draft = unwrap(await createRevisionFrom().execute({ id: created.id }));
            unwrap(await publishTheme().execute({ id: draft.id }));
            const forward = unwrap(await activateTheme().execute({ id: draft.id }));

            expect(forward.pointer.version).toBe(2);
            expect(forward.previous?.version).toBe(1);

            // Rollback is the same operation against the older version.
            const back = unwrap(await activateTheme().execute({ id: created.id }));

            expect(back.pointer.version).toBe(1);
            expect(back.previous?.version).toBe(2);

            const active = unwrap(await getActiveTheme().execute());
            expect(active.theme?.version).toBe(1);
        });

        it("returns to the no-active-theme state", async () => {
            const created = unwrap(await createTheme().execute(themeMocks.blank));
            unwrap(await publishTheme().execute({ id: created.id }));
            unwrap(await activateTheme().execute({ id: created.id }));

            const result = unwrap(await deactivateTheme().execute());
            expect(result.previous?.id).toBe(created.id);

            const active = unwrap(await getActiveTheme().execute());
            expect(active.theme).toBeNull();
            expect(active.pointer).toBeNull();
        });
    });

    describe("delete", () => {
        it("deletes a theme that is not active", async () => {
            const created = unwrap(await createTheme().execute(themeMocks.blank));

            unwrap(await deleteTheme().execute({ id: created.id }));

            const found = await getTheme().execute(created.id);
            expect(found.isFail()).toBe(true);
        });

        it("refuses to delete the active theme", async () => {
            const created = unwrap(await createTheme().execute(themeMocks.blank));
            unwrap(await publishTheme().execute({ id: created.id }));
            unwrap(await activateTheme().execute({ id: created.id }));

            const result = await deleteTheme().execute({ id: created.id });

            expect(result.isFail()).toBe(true);
            if (result.isFail()) {
                expect(result.error.code).toBe("Theme/IsActive");
            }
        });

        it("allows deletion once the theme is deactivated", async () => {
            const created = unwrap(await createTheme().execute(themeMocks.blank));
            unwrap(await publishTheme().execute({ id: created.id }));
            unwrap(await activateTheme().execute({ id: created.id }));
            unwrap(await deactivateTheme().execute());

            const result = await deleteTheme().execute({ id: created.id });
            expect(result.isFail()).toBe(false);
        });
    });
});

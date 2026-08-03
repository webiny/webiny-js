import { beforeEach, describe, expect, it } from "vitest";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import { useHandler } from "./utils/useHandler.js";
import { themeMocks } from "./mocks/theme.mock.js";
import { CreateThemeUseCase } from "~/features/CreateTheme/index.js";
import { UpdateThemeUseCase } from "~/features/UpdateTheme/index.js";
import { PublishThemeUseCase } from "~/features/PublishTheme/index.js";
import { GetThemeByIdUseCase } from "~/features/GetThemeById/index.js";
import { CreateThemeRevisionFromUseCase } from "~/features/CreateThemeRevisionFrom/index.js";
import { ThemeArtifactService } from "~/features/ThemeArtifacts/index.js";
import { toRevisionId } from "~/constants.js";

const unwrap = <T>(result: { isFail(): boolean; error?: unknown; value?: T }): T => {
    if (result.isFail()) {
        throw result.error;
    }
    return result.value as T;
};

describe("Theme artifacts", () => {
    let context: ApiCoreContext;

    const createTheme = () => context.container.resolve(CreateThemeUseCase);
    const updateTheme = () => context.container.resolve(UpdateThemeUseCase);
    const publishTheme = () => context.container.resolve(PublishThemeUseCase);
    const getTheme = () => context.container.resolve(GetThemeByIdUseCase);
    const createRevisionFrom = () => context.container.resolve(CreateThemeRevisionFromUseCase);
    const artifacts = () => context.container.resolve(ThemeArtifactService);

    beforeEach(async () => {
        context = await useHandler({}).handler();
    });

    const publishedTheme = async () => {
        const created = unwrap(await createTheme().execute(themeMocks.blank));
        const { theme } = unwrap(await publishTheme().execute({ id: created.id }));
        return theme;
    };

    describe("published versions", () => {
        it("renders CSS from the frozen snapshot and marks it cacheable forever", async () => {
            const theme = await publishedTheme();
            const rendered = unwrap(artifacts().render(theme, "tokens.css"));

            expect(rendered.contentType).toBe("text/css; charset=utf-8");
            expect(rendered.immutable).toBe(true);
            expect(rendered.body).toContain(":root {");
            expect(rendered.body).toContain("--wby-color-surface-page: #F8FAFC;");
            expect(rendered.body).toContain('[data-wby-theme-mode="dark"]');
        });

        it("renders JSON identifying the version it came from", async () => {
            const theme = await publishedTheme();
            const rendered = unwrap(artifacts().render(theme, "tokens.json"));

            expect(rendered.contentType).toBe("application/json; charset=utf-8");
            expect(rendered.immutable).toBe(true);

            const parsed = JSON.parse(rendered.body);
            expect(parsed).toMatchObject({
                schemaVersion: 1,
                themeId: theme.entryId,
                version: theme.version,
                cssVariablePrefix: "--wby-"
            });
            expect(parsed.tokens.length).toBeGreaterThan(50);
        });

        it("is byte-identical across calls, so caching is safe", async () => {
            const theme = await publishedTheme();

            const first = unwrap(artifacts().render(theme, "tokens.css"));
            const second = unwrap(artifacts().render(theme, "tokens.css"));

            expect(first.body).toBe(second.body);
        });

        it("keeps rendering the published values after a later draft diverges", async () => {
            // The immutability guarantee: repointing a primitive on a later draft must not change
            // what an already-published version renders.
            const created = unwrap(await createTheme().execute(themeMocks.blank));
            const { theme: published } = unwrap(await publishTheme().execute({ id: created.id }));

            const before = unwrap(artifacts().render(published, "tokens.css")).body;
            expect(before).toContain("--wby-color-surface-page: #F8FAFC;");

            const draft = unwrap(await createRevisionFrom().execute({ id: published.id }));
            const tokens = structuredClone(draft.tokens);
            // oxlint-disable-next-line no-explicit-any
            (tokens.color as any).brand["neutral-50"] = { $value: "#FF0000" };
            unwrap(await updateTheme().execute({ id: draft.id, data: { tokens } }));

            // The draft now renders red; the published version is untouched.
            const editedDraft = unwrap(await getTheme().execute(draft.id));
            expect(unwrap(artifacts().render(editedDraft, "tokens.css")).body).toContain(
                "--wby-color-surface-page: #FF0000;"
            );

            const reread = unwrap(await getTheme().execute(published.id));
            const after = unwrap(artifacts().render(reread, "tokens.css")).body;

            expect(after).toBe(before);
            expect(after).not.toContain("#FF0000");
        });
    });

    describe("drafts", () => {
        it("renders on demand and refuses to be cached", async () => {
            const created = unwrap(await createTheme().execute(themeMocks.blank));
            const rendered = unwrap(artifacts().render(created, "tokens.css"));

            expect(rendered.immutable).toBe(false);
            expect(rendered.body).toContain("--wby-color-surface-page: #F8FAFC;");
        });

        it("reflects unsaved-to-published edits, which is what makes preview possible", async () => {
            const created = unwrap(await createTheme().execute(themeMocks.blank));

            const tokens = structuredClone(created.tokens);
            // oxlint-disable-next-line no-explicit-any
            (tokens.color as any).brand["neutral-50"] = { $value: "#FF0000" };
            const updated = unwrap(
                await updateTheme().execute({ id: created.id, data: { tokens } })
            );

            const rendered = unwrap(artifacts().render(updated, "tokens.css"));
            expect(rendered.body).toContain("--wby-color-surface-page: #FF0000;");
        });

        it("returns the blocker list rather than throwing on an invalid draft", async () => {
            const created = unwrap(await createTheme().execute(themeMocks.blank));

            const tokens = structuredClone(created.tokens);
            // oxlint-disable-next-line no-explicit-any
            (tokens.color as any).surface.page = { $value: "{color.brand.nope}" };
            const updated = unwrap(
                await updateTheme().execute({ id: created.id, data: { tokens } })
            );

            const result = artifacts().render(updated, "tokens.css");

            expect(result.isFail()).toBe(true);
            if (result.isFail()) {
                expect(result.error.code).toBe("Theme/NotPublishable");
                expect(result.error.data?.blockers?.[0].path).toBe("color.surface.page");
            }
        });
    });

    describe("revision ids", () => {
        it("zero-pads the version the way the CMS does", () => {
            expect(toRevisionId("abc", 1)).toBe("abc#0001");
            expect(toRevisionId("abc", 42)).toBe("abc#0042");
        });

        it("round-trips through the repository", async () => {
            const theme = await publishedTheme();
            const found = unwrap(
                await getTheme().execute(toRevisionId(theme.entryId, theme.version))
            );

            expect(found.id).toBe(theme.id);
        });
    });
});

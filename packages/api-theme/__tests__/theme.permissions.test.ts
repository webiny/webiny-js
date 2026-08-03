import { beforeEach, describe, expect, it } from "vitest";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
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

const NOT_AUTHORIZED = "Theme/NotAuthorized";

describe("Theme permissions — no permissions at all", () => {
    let context: ApiCoreContext;

    beforeEach(async () => {
        context = await useHandler({ permissions: [] }).handler();
    });

    it.each([
        ["create", () => context.container.resolve(CreateThemeUseCase).execute(themeMocks.blank)],
        ["read", () => context.container.resolve(GetThemeByIdUseCase).execute("some-id#0001")],
        ["list", () => context.container.resolve(ListThemesUseCase).execute()],
        [
            "update",
            () =>
                context.container
                    .resolve(UpdateThemeUseCase)
                    .execute({ id: "some-id#0001", data: {} })
        ],
        ["delete", () => context.container.resolve(DeleteThemeUseCase).execute({ id: "x#0001" })],
        ["revisions", () => context.container.resolve(GetThemeRevisionsUseCase).execute("x")],
        [
            "branch a revision",
            () =>
                context.container.resolve(CreateThemeRevisionFromUseCase).execute({ id: "x#0001" })
        ],
        ["publish", () => context.container.resolve(PublishThemeUseCase).execute({ id: "x#0001" })],
        [
            "activate",
            () => context.container.resolve(ActivateThemeUseCase).execute({ id: "x#0001" })
        ],
        ["deactivate", () => context.container.resolve(DeactivateThemeUseCase).execute()],
        ["read the active theme", () => context.container.resolve(GetActiveThemeUseCase).execute()]
    ])("refuses to %s", async (_label, run) => {
        const result = await run();

        expect(result.isFail()).toBe(true);
        if (result.isFail()) {
            expect(result.error.code).toBe(NOT_AUTHORIZED);
        }
    });
});

describe("Theme permissions — read only", () => {
    let context: ApiCoreContext;

    beforeEach(async () => {
        context = await useHandler({
            permissions: [{ name: "theme.theme", rwd: "r" }]
        }).handler();
    });

    it("allows reading", async () => {
        const result = await context.container.resolve(ListThemesUseCase).execute();
        expect(result.isFail()).toBe(false);
    });

    it("refuses creating", async () => {
        const result = await context.container
            .resolve(CreateThemeUseCase)
            .execute(themeMocks.blank);

        expect(result.isFail()).toBe(true);
        if (result.isFail()) {
            expect(result.error.code).toBe(NOT_AUTHORIZED);
        }
    });

    it("refuses publishing", async () => {
        const result = await context.container
            .resolve(PublishThemeUseCase)
            .execute({ id: "x#0001" });

        expect(result.isFail()).toBe(true);
        if (result.isFail()) {
            expect(result.error.code).toBe(NOT_AUTHORIZED);
        }
    });

    it("refuses activating", async () => {
        const result = await context.container
            .resolve(ActivateThemeUseCase)
            .execute({ id: "x#0001" });

        expect(result.isFail()).toBe(true);
        if (result.isFail()) {
            expect(result.error.code).toBe(NOT_AUTHORIZED);
        }
    });
});

describe("Theme permissions — edit without publish", () => {
    let context: ApiCoreContext;

    beforeEach(async () => {
        context = await useHandler({
            permissions: [{ name: "theme.theme", rwd: "rwd" }]
        }).handler();
    });

    it("allows creating and editing", async () => {
        const created = await context.container
            .resolve(CreateThemeUseCase)
            .execute(themeMocks.blank);

        expect(created.isFail()).toBe(false);
        if (created.isFail()) {
            return;
        }

        const updated = await context.container.resolve(UpdateThemeUseCase).execute({
            id: created.value.id,
            data: { properties: { name: "Renamed" } }
        });

        expect(updated.isFail()).toBe(false);
    });

    it("refuses publishing without the publish action", async () => {
        const created = await context.container
            .resolve(CreateThemeUseCase)
            .execute(themeMocks.blank);

        if (created.isFail()) {
            throw created.error;
        }

        const result = await context.container
            .resolve(PublishThemeUseCase)
            .execute({ id: created.value.id });

        expect(result.isFail()).toBe(true);
        if (result.isFail()) {
            expect(result.error.code).toBe(NOT_AUTHORIZED);
        }
    });

    it("refuses activating without the publish action", async () => {
        const result = await context.container
            .resolve(ActivateThemeUseCase)
            .execute({ id: "x#0001" });

        expect(result.isFail()).toBe(true);
        if (result.isFail()) {
            expect(result.error.code).toBe(NOT_AUTHORIZED);
        }
    });
});

describe("Theme permissions — full access", () => {
    let context: ApiCoreContext;

    beforeEach(async () => {
        context = await useHandler({
            permissions: [{ name: "theme.theme", rwd: "rwd", pw: "pu" }]
        }).handler();
    });

    it("can run the whole lifecycle", async () => {
        const created = await context.container
            .resolve(CreateThemeUseCase)
            .execute(themeMocks.blank);
        if (created.isFail()) {
            throw created.error;
        }

        const published = await context.container
            .resolve(PublishThemeUseCase)
            .execute({ id: created.value.id });
        expect(published.isFail()).toBe(false);

        const activated = await context.container
            .resolve(ActivateThemeUseCase)
            .execute({ id: created.value.id });
        expect(activated.isFail()).toBe(false);
    });
});

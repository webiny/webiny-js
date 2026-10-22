import { describe, it, expect, beforeEach, vi } from "vitest";
import { Container } from "@webiny/di";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import {
    ListLanguagesRepository,
    ListLanguagesUseCase,
    type LanguageDto
} from "@webiny/languages/admin/features/listLanguages/abstractions.js";
import { WbPageStatus } from "~/constants.js";
import {
    type Layout,
    LayoutError,
    LayoutsGateway,
    LayoutsRepository
} from "~/features/layouts/index.js";
import { LayoutsRepository as LayoutsRepositoryImpl } from "~/features/layouts/shared/LayoutsRepository.js";
import { ListLayoutsFeature } from "~/features/layouts/listLayouts/feature.js";
import { GetLayoutSettingsFeature } from "~/features/layouts/getLayoutSettings/feature.js";
import { DeleteLayoutFeature } from "~/features/layouts/deleteLayout/feature.js";
import { DuplicateLayoutFeature } from "~/features/layouts/duplicateLayout/feature.js";
import { TranslateLayoutFeature } from "~/features/layouts/translateLayout/feature.js";
import { SetDefaultLayoutFeature } from "~/features/layouts/setDefaultLayout/feature.js";
import { LayoutsListPresenter } from "./abstractions.js";
import { LayoutsListPresenterRegistration } from "./LayoutsListPresenter.js";

const createLayout = (
    entryId: string,
    title: string,
    properties: Partial<Layout["properties"]> = {},
    overrides: Partial<Layout> = {}
): Layout => ({
    id: `${entryId}#0001`,
    entryId,
    status: WbPageStatus.Draft,
    version: 1,
    locked: false,
    live: null,
    properties: { title, ...properties },
    metadata: {},
    elements: {},
    bindings: {},
    extensions: {},
    createdOn: null,
    savedOn: null,
    modifiedOn: null,
    createdBy: null,
    savedBy: null,
    ...overrides
});

const site = createLayout(
    "site",
    "Site layout",
    { language: "en", slug: "site" },
    { status: WbPageStatus.Published, locked: true, live: { version: 1 } }
);
const siteHr = createLayout("site-hr", "Site layout", { language: "hr", sourceLayout: "site" });
const siteDe = createLayout("site-de", "Site layout", { language: "de", sourceLayout: "site" });
const blog = createLayout("blog", "Blog");

const languages: LanguageDto[] = [
    { id: "en", code: "en", name: "English", isDefault: true },
    { id: "de", code: "de", name: "German" },
    { id: "hr", code: "hr", name: "Croatian" },
    { id: "fr", code: "fr", name: "French" }
];

const createGateway = () => ({
    list: vi.fn(async () => [site, siteHr, siteDe, blog]),
    get: vi.fn(),
    getRevisions: vi.fn(),
    getPageLayout: vi.fn(),
    getSettings: vi.fn(async () => ({ defaultLayout: "site" })),
    create: vi.fn(),
    update: vi.fn(),
    publish: vi.fn(),
    unpublish: vi.fn(),
    createRevisionFrom: vi.fn(),
    deleteRevision: vi.fn(),
    delete: vi.fn(async () => undefined),
    duplicate: vi.fn(),
    translate: vi.fn(),
    setDefaultLayout: vi.fn(async (entryId: string | null) => ({ defaultLayout: entryId }))
});

describe("LayoutsListPresenter", () => {
    let gateway: ReturnType<typeof createGateway>;
    let notifications: { success: any; warning: any; notify: any };
    let presenter: LayoutsListPresenter.Interface;

    beforeEach(async () => {
        gateway = createGateway();
        notifications = { success: vi.fn(), warning: vi.fn(), notify: vi.fn() };

        const container = new Container();
        container.registerInstance(LayoutsGateway, gateway as any);
        container.register(LayoutsRepositoryImpl).inSingletonScope();
        ListLayoutsFeature.register(container);
        GetLayoutSettingsFeature.register(container);
        DeleteLayoutFeature.register(container);
        DuplicateLayoutFeature.register(container);
        TranslateLayoutFeature.register(container);
        SetDefaultLayoutFeature.register(container);
        container.registerInstance(ListLanguagesUseCase, { execute: async () => languages });
        container.registerInstance(ListLanguagesRepository, {
            execute: async () => languages,
            getLanguages: () => languages
        });
        container.registerInstance(Notifications, notifications as any);
        container.register(LayoutsListPresenterRegistration);

        presenter = container.resolve(LayoutsListPresenter);
        await presenter.init();

        // The repository is shared: make sure it's the one the presenter reads.
        expect(container.resolve(LayoutsRepository).layouts).toHaveLength(4);
    });

    it("lists source layouts with their language versions", () => {
        const { rows, hasLanguages } = presenter.vm;

        expect(hasLanguages).toBe(true);
        expect(rows.map(row => row.title)).toEqual(["Blog", "Site layout"]);

        const siteRow = rows[1];
        expect(siteRow.language).toBe("en");
        expect(siteRow.languageLabel).toBe("English (en)");
        expect(siteRow.status).toBe(WbPageStatus.Published);
        expect(siteRow.version).toBe(1);
        expect(siteRow.liveVersion).toBe(1);
        expect(siteRow.versions.map(version => version.language)).toEqual(["de", "hr"]);
        expect(siteRow.versions[0].languageLabel).toBe("German (de)");
    });

    it("shows each source layout's slug, and none for a layout without one", () => {
        const [blogRow, siteRow] = presenter.vm.rows;

        expect(siteRow.slug).toBe("site");
        expect(blogRow.slug).toBeNull();
    });

    it("marks the default layout, and only lets a published source layout become the default", () => {
        const [blogRow, siteRow] = presenter.vm.rows;

        expect(siteRow.isDefault).toBe(true);
        expect(siteRow.canSetDefault).toBe(false);
        expect(blogRow.isDefault).toBe(false);
        // Blog has no published revision.
        expect(blogRow.canSetDefault).toBe(false);
    });

    it("offers only languages without a version to translate into", () => {
        const [blogRow, siteRow] = presenter.vm.rows;

        expect(siteRow.translatableLanguages.map(language => language.code)).toEqual(["fr"]);
        expect(blogRow.translatableLanguages.map(language => language.code)).toEqual([
            "en",
            "de",
            "hr",
            "fr"
        ]);
    });

    it("names the language versions deleted with a source layout", () => {
        expect(presenter.getDeleteConfirmation(site)).toBe(
            `Delete "Site layout" and its 2 language versions (de, hr)? Pages can't use them afterwards. This can't be undone.`
        );
        expect(presenter.getDeleteConfirmation(blog)).toBe(
            `Delete "Blog"? Pages can't use it afterwards. This can't be undone.`
        );
        expect(presenter.getDeleteConfirmation(siteDe)).toBe(
            `Delete the "de" language version of "Site layout"? This can't be undone.`
        );
    });

    it("deletes a source layout together with its language versions", async () => {
        const deleted = await presenter.delete(site);

        expect(deleted).toBe(true);
        expect(gateway.delete).toHaveBeenCalledWith("site");
        expect(presenter.vm.rows.map(row => row.title)).toEqual(["Blog"]);
    });

    it("explains why a layout in use can't be deleted", async () => {
        gateway.delete.mockRejectedValue(
            new LayoutError({
                message: "Layout is in use.",
                code: "WebsiteBuilder/Layout/InUse",
                data: { id: "site", pages: 3, isDefault: false }
            })
        );

        const deleted = await presenter.delete(site);

        expect(deleted).toBe(false);
        expect(notifications.warning).toHaveBeenCalledWith({
            title: "Could not delete the layout",
            description:
                "This layout is in use by 3 pages. Pick another layout in their settings first."
        });
        expect(presenter.vm.rows).toHaveLength(2);
    });

    it("explains that the default layout can't be deleted", async () => {
        gateway.delete.mockRejectedValue(
            new LayoutError({
                message: "Layout is in use.",
                code: "WebsiteBuilder/Layout/InUse",
                data: { id: "site", pages: 0, isDefault: true }
            })
        );

        await presenter.delete(site);

        expect(notifications.warning).toHaveBeenCalledWith({
            title: "Could not delete the layout",
            description: "This layout is the default layout. Pick another default layout first."
        });
    });

    it("adds a new language version under its source", async () => {
        const siteFr = createLayout("site-fr", "Site layout", {
            language: "fr",
            sourceLayout: "site"
        });
        gateway.translate.mockResolvedValue(siteFr);

        const version = await presenter.translate(site, "fr");

        expect(gateway.translate).toHaveBeenCalledWith("site#0001", "fr");
        expect(version?.id).toBe("site-fr#0001");
        const siteRow = presenter.vm.rows[1];
        expect(siteRow.versions.map(item => item.language)).toEqual(["de", "fr", "hr"]);
        expect(siteRow.translatableLanguages).toEqual([]);
    });

    it("lists a duplicated layout", async () => {
        gateway.duplicate.mockResolvedValue(
            createLayout("copy", "Site layout (copy)", { language: "en" })
        );

        await presenter.duplicate(site);

        expect(gateway.duplicate).toHaveBeenCalledWith("site#0001");
        expect(presenter.vm.rows.map(row => row.title)).toEqual([
            "Blog",
            "Site layout",
            "Site layout (copy)"
        ]);
    });

    it("sets and clears the default layout", async () => {
        await presenter.setDefault(null);
        expect(gateway.setDefaultLayout).toHaveBeenCalledWith(null);
        expect(presenter.vm.rows.some(row => row.isDefault)).toBe(false);
        expect(presenter.vm.rows[1].canSetDefault).toBe(true);

        await presenter.setDefault(site);
        expect(gateway.setDefaultLayout).toHaveBeenLastCalledWith("site");
        expect(presenter.vm.rows[1].isDefault).toBe(true);
    });
});

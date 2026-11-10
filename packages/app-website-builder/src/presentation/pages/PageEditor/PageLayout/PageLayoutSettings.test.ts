import { describe, it, expect, beforeEach, vi } from "vitest";
import { Container } from "@webiny/di";
import { FormModelFeature } from "@webiny/app-admin/features/formModel/feature.js";
import { IdentityContextFeature } from "@webiny/app-admin/features/security/IdentityContext/feature.js";
import type {
    IFieldVM,
    IObjectFieldVM,
    LayoutNodeVM
} from "@webiny/app-admin/features/formModel/abstractions.js";
import { WbPageStatus } from "~/constants.js";
import { type Layout, LayoutsGateway } from "~/features/layouts/index.js";
import { LayoutsRepository as LayoutsRepositoryImpl } from "~/features/layouts/shared/LayoutsRepository.js";
import { ListLayoutsFeature } from "~/features/layouts/listLayouts/feature.js";
import { PageSettingsGroup, PageSettingsPresenter } from "../PageSettings/abstractions.js";
import { PageSettingsPresenterRegistration } from "../PageSettings/PageSettingsPresenter.js";
import { GeneralSettingsGroup } from "../PageSettings/groups/GeneralSettingsGroup.js";
import { PageLayoutSettings } from "./PageLayoutSettings.js";

// Layouts are listed in the background when the settings form is built.
const flush = () => new Promise(resolve => setTimeout(resolve, 0));

const createLayout = (
    entryId: string,
    title: string,
    overrides: Partial<Layout> = {},
    properties: Partial<Layout["properties"]> = {}
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

const published = { status: WbPageStatus.Published, locked: true, live: { version: 1 } };

const main = createLayout("main", "Main", published);
const blog = createLayout("blog", "Blog", published);
// Not pickable: never published, unpublished, and a language version of a published layout.
const draft = createLayout("draft", "Draft");
const retired = createLayout("retired", "Retired", { status: WbPageStatus.Unpublished });
const mainDe = createLayout("main-de", "Main", published, { sourceLayout: "main" });

const createGateway = () => ({
    list: vi.fn(async () => [main, draft, retired, mainDe, blog]),
    get: vi.fn(),
    getRevisions: vi.fn(),
    getPageLayout: vi.fn(),
    getSettings: vi.fn(),
    getUsage: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    publish: vi.fn(),
    unpublish: vi.fn(),
    createRevisionFrom: vi.fn(),
    deleteRevision: vi.fn(),
    delete: vi.fn(),
    duplicate: vi.fn(),
    translate: vi.fn(),
    setDefaultLayout: vi.fn()
});

// A page as the editor opens it. The API gives a page created without picking a layout the default one.
const createPage = (properties: Record<string, any> = {}): PageSettingsGroup.PageDocument => ({
    properties: { title: "Home", path: "/home", ...properties } as any,
    metadata: {} as any,
    extensions: {} as any
});

const findField = (nodes: LayoutNodeVM[], name: string): IFieldVM | undefined => {
    for (const node of nodes) {
        if (node.type === "tabs") {
            const found = findField(
                node.tabs.flatMap(tab => tab.layout),
                name
            );
            if (found) {
                return found;
            }
        }
        if (node.type !== "row") {
            continue;
        }
        for (const field of node.fields) {
            if (field.qualifiedName === name) {
                return field;
            }
            if (field.type === "object") {
                const found = findField((field as IObjectFieldVM).layout, name);
                if (found) {
                    return found;
                }
            }
        }
    }
    return undefined;
};

describe("PageLayoutSettings", () => {
    let gateway: ReturnType<typeof createGateway>;
    let presenter: PageSettingsPresenter.Interface;

    const layoutField = () => {
        const field = findField(presenter.vm.form?.layout ?? [], "general.layout");
        if (!field) {
            throw new Error(`The page settings have no Layout field.`);
        }
        return field;
    };

    beforeEach(() => {
        gateway = createGateway();

        const container = new Container();
        IdentityContextFeature.register(container);
        FormModelFeature.register(container);
        container.registerInstance(LayoutsGateway, gateway as any);
        container.register(LayoutsRepositoryImpl).inSingletonScope();
        ListLayoutsFeature.register(container);
        container.register(GeneralSettingsGroup);
        container.register(PageLayoutSettings);
        container.register(PageSettingsPresenterRegistration);

        presenter = container.resolve(PageSettingsPresenter);
    });

    it("has a Layout field that lists published source layouts by title", async () => {
        presenter.init(createPage());
        await flush();

        const field = layoutField();
        expect(gateway.list).toHaveBeenCalledTimes(1);
        expect(field.label).toBe("Layout");
        expect(field.options).toEqual([
            { label: "Blog", value: "blog" },
            { label: "Main", value: "main" }
        ]);
    });

    it("shows the layout a new page was created with, and saves it unchanged", async () => {
        presenter.init(createPage({ layout: "main" }));
        await flush();

        expect(layoutField().value).toBe("main");

        const saved = await presenter.submit();
        expect(saved && saved.properties.layout).toBe("main");
    });

    it("leaves a page without a layout when the field is cleared", async () => {
        presenter.init(createPage({ layout: "main" }));
        await flush();

        layoutField().onChange(null);
        expect(layoutField().value).toBeNull();

        const saved = await presenter.submit();
        expect(saved).not.toBe(false);
        expect(saved && saved.properties.layout).toBeNull();
    });

    it("saves no layout when an emptied field holds an empty string", async () => {
        presenter.init(createPage({ layout: "main" }));
        await flush();

        layoutField().onChange("");

        const saved = await presenter.submit();
        expect(saved && saved.properties.layout).toBeNull();
    });

    it("shows no layout for a page without one", async () => {
        presenter.init(createPage());
        await flush();

        expect(layoutField().value).toBeNull();
    });
});

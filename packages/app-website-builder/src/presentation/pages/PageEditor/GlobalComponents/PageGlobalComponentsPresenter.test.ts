import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { Editor } from "~/editorSdk/Editor.js";
import { SaveGlobalComponentUseCase } from "~/features/globals/saveGlobalComponent/abstractions.js";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { PageGlobalComponentsPresenter } from "./abstractions.js";
import { PageGlobalComponentsPresenterRegistration } from "./PageGlobalComponentsPresenter.js";

// Document state updates are committed in a microtask.
const flush = () => new Promise(resolve => setTimeout(resolve, 0));

const HEADER = "$global:Demo/Header";
const text = (value: string) => ({ id: value, type: "text", static: value });
const element = (id: string, name: string, parentId?: string) => ({
    type: "Webiny/Element",
    id,
    component: { name },
    ...(parentId ? { parent: { id: parentId, slot: "children" } } : {})
});

// A page as stored, with its layout: a header placement, a banner and the main content area.
const createPage = (): any => ({
    id: "page#0001",
    version: 1,
    status: "draft",
    state: {},
    metadata: {},
    extensions: {},
    properties: { language: "en", layout: "layout" },
    elements: { root: element("root", "Webiny/Root") },
    bindings: {
        root: { inputs: { children: { type: "slot", list: true, static: [] } } },
        banner: { inputs: { headline: text("Page headline") } },
        [HEADER]: { inputs: { title: text("Page title") } }
    },
    layout: {
        id: "layout#0001",
        entryId: "layout",
        properties: { title: "Main" },
        elements: {
            root: element("root", "Webiny/Root"),
            hdr: element("hdr", "Demo/Header", "root"),
            banner: element("banner", "Custom/Banner", "root"),
            content: element("content", "Webiny/LayoutContent", "root")
        },
        bindings: {
            root: {
                inputs: {
                    children: { type: "slot", list: true, static: ["hdr", "banner", "content"] }
                }
            },
            banner: { inputs: { headline: text("Layout headline"), ctaLabel: text("Go") } }
        }
    }
});

const records: any[] = [
    {
        name: "Demo/Header",
        language: "en",
        elements: { [HEADER]: element(HEADER, "Demo/Header") },
        bindings: {
            [HEADER]: { inputs: { title: text("Global title"), tagline: text("Tagline") } }
        }
    }
];

const createPresenter = (
    saveGlobalComponent: any = { execute: async () => ({}) },
    notifications: any = { warning: () => {} }
) => {
    const container = new Container();
    container.registerInstance(SaveGlobalComponentUseCase, saveGlobalComponent);
    container.registerInstance(Notifications, notifications);
    container.register(PageGlobalComponentsPresenterRegistration);
    return container.resolve(PageGlobalComponentsPresenter);
};

// A page open in the editor, with the Site Header registered as a global and the banner as the layout's.
const openPage = (saveGlobalComponent?: any) => {
    const presenter = createPresenter(saveGlobalComponent);
    const editor = new Editor(presenter.prepare(createPage(), records) as any);
    editor.updateEditor((state: any) => {
        state.components["Demo/Header"] = {
            name: "Demo/Header",
            global: true,
            inputs: [{ name: "title", label: "Title" }]
        };
        state.components["Custom/Banner"] = { name: "Custom/Banner", inputs: [] };
    });
    presenter.init(editor);

    const select = (id: string) => {
        editor.updateEditor((state: any) => {
            state.selectedElement = id;
        });
    };
    const setTitle = (title: string) => {
        editor.updateDocument((document: any) => {
            document.bindings[HEADER].inputs.title = text(title);
        });
    };

    return { presenter, editor, select, setTitle };
};

describe("PageGlobalComponentsPresenter", () => {
    it("shows which language a global placed by the layout is saved in", async () => {
        const { presenter, select } = openPage();

        select("hdr");
        await flush();

        expect(presenter.vm.target).toMatchObject({
            kind: "global",
            title: "Global component · en · from the layout",
            language: "en",
            hasChanges: false,
            status: "No unsaved changes"
        });
    });

    it("asks whether to save a changed global on this page only or in the global component", async () => {
        const { presenter, select, setTitle } = openPage();

        select(HEADER);
        setTitle("New title");
        await flush();

        expect(presenter.vm.target).toMatchObject({
            hasChanges: true,
            status: "Changes detected",
            defaultSaveTarget: "document",
            saveNote: null,
            saveOptions: [
                { value: "document", label: "Only on this page", disabled: false },
                {
                    value: "global",
                    label: `Global component (every page in "en")`,
                    disabled: false
                }
            ]
        });
    });

    it("saves a changed global in the global component of the page's language", async () => {
        const saved: any[] = [];
        const { presenter, editor, select, setTitle } = openPage({
            execute: async (params: any) => {
                saved.push(params);
                return params.globalComponent;
            }
        });

        select(HEADER);
        setTitle("New title");
        await flush();
        await presenter.save("global");

        expect(saved).toHaveLength(1);
        expect(saved[0].globalComponent).toMatchObject({ name: "Demo/Header", language: "en" });
        expect(saved[0].globalComponent.bindings[HEADER].inputs.title.static).toBe("New title");
        expect(presenter.vm.target).toMatchObject({ hasChanges: false });

        // The page's own override of the title went: the saved global shows.
        const stored = presenter.toStoredDocument(editor.getDocumentState().toJson() as any);
        expect(stored.bindings[HEADER]).toBeUndefined();
    });

    it("keeps a changed global on this page only, and saves nothing in the global component", async () => {
        const saved: any[] = [];
        const { presenter, editor, select, setTitle } = openPage({
            execute: async (params: any) => saved.push(params)
        });

        select(HEADER);
        setTitle("Page only");
        await flush();
        await presenter.save("document");

        expect(saved).toEqual([]);
        expect(presenter.vm.target).toMatchObject({ hasChanges: false });
        const stored = presenter.toStoredDocument(editor.getDocumentState().toJson() as any);
        expect(stored.bindings[HEADER]).toEqual({ inputs: { title: text("Page only") } });
    });

    it("shows a layout's element as the layout's, with changes that apply to this page only", async () => {
        const { presenter, select } = openPage();

        select("banner");
        await flush();

        expect(presenter.vm.target).toMatchObject({
            kind: "layoutElement",
            title: "Layout component · Main",
            status: "Changes apply to this page only.",
            canSaveToGlobal: false
        });
    });

    it("composes the globals and the layout's elements into the page", () => {
        const page = createPresenter().prepare(createPage(), records);

        expect(page.bindings[HEADER].inputs?.title.static).toBe("Page title");
        expect(page.bindings[HEADER].inputs?.tagline.static).toBe("Tagline");
        expect(page.bindings.banner.inputs?.headline.static).toBe("Page headline");
        expect(page.layout?.bindings.banner.inputs?.ctaLabel.static).toBe("Go");
        expect(page.layout?.bindings.banner.inputs?.headline.static).toBe("Page headline");
        // The page keeps its own root: it renders in the layout's main content area.
        expect(page.bindings.root.inputs?.children.static).toEqual([]);
        expect(page.layout?.bindings.root.inputs?.children.static).toEqual([
            "hdr",
            "banner",
            "content"
        ]);
    });

    it("settles once opened, and stores only the page's overrides", async () => {
        const presenter = createPresenter();
        const editor = new Editor(presenter.prepare(createPage(), records) as any);
        presenter.init(editor);

        let updates = 0;
        editor.onDocumentStateChange(() => updates++);

        editor.updateDocument((document: any) => {
            document.bindings.banner.inputs.ctaLabel = text("Page CTA");
        });
        for (let i = 0; i < 10; i++) {
            await flush();
        }

        expect(updates).toBeLessThan(5);
        const layout = (editor.getDocumentState().read() as any).layout;
        expect(layout.bindings.banner.inputs.ctaLabel.static).toBe("Page CTA");

        const stored = presenter.toStoredDocument(editor.getDocumentState().toJson() as any);
        expect(stored.elements[HEADER]).toBeUndefined();
        expect(stored.bindings[HEADER]).toEqual({ inputs: { title: text("Page title") } });
        expect(stored.bindings.banner).toEqual({
            inputs: { headline: text("Page headline"), ctaLabel: text("Page CTA") }
        });
        expect(stored.bindings.root.inputs?.children.static).toEqual([]);
    });

    it("doesn't save a global in the global component when its records couldn't be listed", async () => {
        const saved: any[] = [];
        const warnings: any[] = [];
        const presenter = createPresenter(
            { execute: async (params: any) => saved.push(params) },
            { warning: (params: any) => warnings.push(params) }
        );

        const editor = new Editor(presenter.prepare(createPage(), null) as any);
        expect(warnings).toHaveLength(1);

        editor.updateEditor((state: any) => {
            state.components["Demo/Header"] = { name: "Demo/Header", global: true, inputs: [] };
        });
        presenter.init(editor);
        await flush();

        // The global still shows, from its defaults.
        expect(editor.getDocumentState().read().elements[HEADER]).toBeDefined();

        editor.updateEditor((state: any) => {
            state.selectedElement = HEADER;
        });
        expect(presenter.vm.target).toMatchObject({ kind: "global", canSaveToGlobal: false });

        await presenter.save("global");
        expect(saved).toEqual([]);
        expect(warnings).toHaveLength(2);
    });
});

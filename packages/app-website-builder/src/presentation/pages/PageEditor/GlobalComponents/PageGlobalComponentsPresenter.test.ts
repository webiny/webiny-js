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

describe("PageGlobalComponentsPresenter", () => {
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

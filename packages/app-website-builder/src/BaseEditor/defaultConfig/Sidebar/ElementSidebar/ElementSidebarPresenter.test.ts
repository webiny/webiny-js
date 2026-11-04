import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { createSlotInput, createTextInput } from "@webiny/website-builder-sdk";
import { Editor } from "~/editorSdk/Editor.js";
import { Commands } from "~/BaseEditor/commands.js";
import { ElementSidebarPresenter } from "./abstractions.js";
import { ElementSidebarFeature } from "./feature.js";

const text = (value: string) => ({ id: value, type: "text", static: value });
const slot = (ids: string[]) => ({ id: "children", type: "slot", list: true, static: ids });
const element = (id: string, name: string, parentId?: string) => ({
    type: "Webiny/Element",
    id,
    component: { name },
    ...(parentId ? { parent: { id: parentId, slot: "children" } } : {})
});

const components: any = {
    "Webiny/Root": { name: "Webiny/Root", inputs: [createSlotInput({ name: "children" })] },
    "Webiny/LayoutContent": { name: "Webiny/LayoutContent", label: "Main content", inputs: [] },
    "Webiny/NamedContent": {
        name: "Webiny/NamedContent",
        label: "Named content",
        inputs: [createTextInput({ name: "area", label: "Area name" })]
    },
    "Custom/Banner": {
        name: "Custom/Banner",
        label: "Banner",
        inputs: [createTextInput({ name: "headline", label: "Headline" })]
    },
    "Custom/Text": {
        name: "Custom/Text",
        label: "Text",
        inputs: [createTextInput({ name: "text", label: "Text" })]
    }
};

// A new layout: its root, with the main content area.
const createLayout = (): any => ({
    id: "layout#0001",
    version: 1,
    state: {},
    metadata: {},
    extensions: {},
    properties: { title: "Main" },
    elements: {
        root: element("root", "Webiny/Root"),
        content: element("content", "Webiny/LayoutContent", "root")
    },
    bindings: {
        root: { inputs: { children: slot(["content"]) } }
    }
});

// A page in a layout with a banner, an empty main content area and a named content area.
const createPage = (): any => ({
    id: "page#0001",
    version: 1,
    status: "draft",
    state: {},
    metadata: {},
    extensions: {},
    properties: { language: "en", layout: "layout" },
    elements: {
        root: element("root", "Webiny/Root"),
        intro: element("intro", "Custom/Text", "root")
    },
    bindings: {
        root: { inputs: { children: slot(["intro"]) } },
        intro: { inputs: { text: text("Hello") } }
    },
    layout: {
        id: "layout#0001",
        entryId: "layout",
        properties: { title: "Main" },
        elements: {
            root: element("root", "Webiny/Root"),
            banner: element("banner", "Custom/Banner", "root"),
            content: element("content", "Webiny/LayoutContent", "root"),
            sidebar: element("sidebar", "Webiny/NamedContent", "root")
        },
        bindings: {
            root: { inputs: { children: slot(["banner", "content", "sidebar"]) } },
            banner: { inputs: { headline: text("Layout headline") } },
            sidebar: { inputs: { area: text("sidebar") } }
        }
    }
});

const open = (document: any) => {
    const editor = new Editor(document);
    editor.updateEditor(state => {
        state.components = components;
    });

    const container = new Container();
    ElementSidebarFeature.register(container);
    const presenter = container.resolve(ElementSidebarPresenter);
    presenter.init(editor);

    const select = (id: string) => {
        editor.updateEditor(state => {
            state.selectedElement = id;
        });
        return presenter.vm.element!;
    };

    return { editor, presenter, select };
};

describe("ElementSidebarPresenter", () => {
    it("in a new layout, shows that Main content has no inputs, and offers no Delete or Clone", () => {
        const { presenter, select } = open(createLayout());
        expect(presenter.vm.element).toBeNull();

        const content = select("content");

        expect(content.id).toBe("content");
        expect(content.actions).toEqual({ delete: false, clone: false });
        expect(content.settings).toEqual({
            elementId: "content",
            layoutArea: null,
            message: "This element has no inputs.",
            inputs: []
        });
    });

    it("in a layout, offers a named content area's Area name to edit, and lets it be deleted but not cloned", () => {
        const { editor, select } = open(createLayout());
        editor.updateDocument((document: any) => {
            document.elements.area = element("area", "Webiny/NamedContent", "root");
            document.bindings.area = { inputs: { area: text("area-2") } };
            document.bindings.root.inputs.children.static.push("area");
        });

        const area = select("area");

        expect(area.actions).toEqual({ delete: true, clone: false });
        expect(area.settings?.layoutArea).toBeNull();
        expect(area.settings?.inputs).toEqual([{ name: "area", label: "Area name" }]);
    });

    it("on a page, offers no Delete or Clone for the layout's Banner, and keeps its inputs", () => {
        const { select } = open(createPage());

        const banner = select("banner");

        expect(banner.id).toBe("banner");
        expect(banner.actions).toEqual({ delete: false, clone: false });
        expect(banner.settings?.layoutArea).toBeNull();
        expect(banner.settings?.inputs).toEqual([{ name: "headline", label: "Headline" }]);
    });

    it("on a page, selecting the layout's named content area selects the area itself, described as the layout's content area", () => {
        const { select } = open(createPage());

        const area = select("sidebar");

        // The area, not the element it sits in.
        expect(area.id).toBe("sidebar");
        expect(area.componentName).toBe("Webiny/NamedContent");
        expect(area.settings?.elementId).toBe("sidebar");
        expect(area.actions).toEqual({ delete: false, clone: false });
    });

    it("on a page, shows the named content area's name and that it's renamed in the layout editor, with no editable Area name field", () => {
        const { select } = open(createPage());

        const { settings } = select("sidebar");

        expect(settings?.layoutArea).toEqual({
            name: "sidebar",
            description:
                "This is the layout's \"sidebar\" content area. Drop this page's content into it. Rename it in the layout editor."
        });
        expect(settings?.inputs).toEqual([]);
        expect(settings?.message).toBeNull();
    });

    it("on a page, describes the layout's Main content as the main content area", () => {
        const { select } = open(createPage());

        const content = select("content");

        expect(content.actions).toEqual({ delete: false, clone: false });
        expect(content.settings?.layoutArea).toEqual({
            name: "main",
            description: "This is the layout's main content area. Drop this page's content into it."
        });
        expect(content.settings?.inputs).toEqual([]);
    });

    it("on a page, deletes and clones the page's own element", () => {
        const { editor, presenter, select } = open(createPage());
        const executed: Array<[string, unknown]> = [];
        editor.registerCommandHandler(Commands.DeleteElement, payload => {
            executed.push(["delete", payload]);
        });
        editor.registerCommandHandler(Commands.CloneElement, payload => {
            executed.push(["clone", payload]);
        });

        const intro = select("intro");
        expect(intro.actions).toEqual({ delete: true, clone: true });
        expect(intro.settings?.inputs).toEqual([{ name: "text", label: "Text" }]);
        expect(intro.settings?.message).toBeNull();

        presenter.cloneElement();
        presenter.deleteElement();
        expect(executed).toEqual([
            ["clone", { id: "intro" }],
            ["delete", { id: "intro" }]
        ]);

        // The layout's elements stay.
        select("banner");
        presenter.deleteElement();
        presenter.cloneElement();
        expect(executed).toHaveLength(2);
    });
});

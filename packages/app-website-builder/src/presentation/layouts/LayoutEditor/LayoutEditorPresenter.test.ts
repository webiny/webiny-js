import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Container } from "@webiny/di";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { type ComponentManifest, LayoutContentArea } from "@webiny/website-builder-sdk";
import { Editor } from "~/editorSdk/Editor.js";
import { $createElement, $updateElementInputs } from "~/editorSdk/utils/index.js";
import { Commands } from "~/BaseEditor/commands.js";
import { getElementNodeData } from "~/BaseEditor/defaultConfig/Toolbar/Navigator/navigatorUtils.js";
import { GetSettingsUseCase } from "~/features/settings/getSettings/abstractions/index.js";
import { GetLayoutUseCase, type Layout, UpdateLayoutUseCase } from "~/features/layouts/index.js";
import type { LayoutEditorDocument } from "./layoutDocument.js";
import { LayoutGlobalComponentsPresenter } from "./GlobalComponents/abstractions.js";
import { LayoutAutoSavePresenter } from "./AutoSave/abstractions.js";
import { LayoutEditorPresenter } from "./abstractions.js";
import { LayoutEditorFeature } from "./feature.js";

// The components a layout is built of, as their manifests reach the editor.
const components = {
    "Webiny/Root": {
        name: "Webiny/Root",
        label: "Root",
        inputs: [
            {
                type: "slot",
                list: true,
                renderer: "Webiny/Slot",
                defaultValue: [],
                name: "children"
            }
        ]
    },
    [LayoutContentArea.MAIN_COMPONENT]: {
        name: LayoutContentArea.MAIN_COMPONENT,
        label: "Main content",
        inputs: []
    },
    [LayoutContentArea.NAMED_COMPONENT]: {
        name: LayoutContentArea.NAMED_COMPONENT,
        label: "Named content",
        inputs: [
            {
                type: "text",
                renderer: "Webiny/Input",
                name: LayoutContentArea.NAME_INPUT,
                label: "Area name",
                translatable: false
            }
        ]
    }
} as unknown as Record<string, ComponentManifest>;

// A new layout, as the API creates it: the main content area, and nothing else.
const newLayout = (): Layout => {
    return {
        id: "site#0001",
        entryId: "site",
        status: "draft",
        version: 1,
        locked: false,
        live: null,
        properties: { title: "Site", slug: "site", language: null },
        metadata: {},
        extensions: {},
        elements: {
            root: { type: "Webiny/Element", id: "root", component: { name: "Webiny/Root" } },
            "layout-content": {
                type: "Webiny/Element",
                id: "layout-content",
                component: { name: LayoutContentArea.MAIN_COMPONENT },
                parent: { id: "root", slot: "children" }
            }
        },
        bindings: {
            root: {
                inputs: {
                    children: { type: "slot", list: true, static: ["layout-content"] }
                }
            }
        },
        createdOn: null,
        savedOn: null,
        modifiedOn: null,
        createdBy: null,
        savedBy: null
    } as unknown as Layout;
};

// Document state changes are announced in a microtask; saves wait for the debounce.
const settle = async () => {
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(500);
};

// The name the canvas labels an area with (`getContentAreaLabel` in website-builder-react: "Named content"
// for an area without one, tested there).
const areaName = (document: LayoutEditorDocument, id: string) => {
    const element = document.elements[id];
    const area = LayoutContentArea.fromElement(
        element,
        document.bindings[id]?.inputs?.[LayoutContentArea.NAME_INPUT]?.static
    );
    return area.name();
};

const navigatorLabel = (document: LayoutEditorDocument, id: string) => {
    const nodes = getElementNodeData({
        components,
        elements: document.elements,
        bindings: document.bindings
    });
    return nodes[id].label;
};

const namedAreaIds = (document: LayoutEditorDocument) => {
    return Object.keys(document.elements).filter(id => {
        return document.elements[id].component.name === LayoutContentArea.NAMED_COMPONENT;
    });
};

describe("LayoutEditorPresenter", () => {
    const getSettings = { execute: vi.fn() };
    const getLayout = { execute: vi.fn() };
    const updateLayout = { execute: vi.fn() };
    const notifications = { success: vi.fn(), warning: vi.fn(), notify: vi.fn() };
    let container: Container;
    let presenter: LayoutEditorPresenter.Interface;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
        getSettings.execute.mockResolvedValue({});
        getLayout.execute.mockResolvedValue(newLayout());
        updateLayout.execute.mockResolvedValue({});

        const globalComponents = {
            toStoredDocument: (document: any) => document,
            onOverridesChange: () => () => {}
        };

        container = new Container();
        container.registerInstance(GetSettingsUseCase, getSettings as any);
        container.registerInstance(GetLayoutUseCase, getLayout as any);
        container.registerInstance(UpdateLayoutUseCase, updateLayout as any);
        container.registerInstance(LayoutGlobalComponentsPresenter, globalComponents as any);
        container.registerInstance(Notifications, notifications as any);
        LayoutEditorFeature.register(container);
        presenter = LayoutEditorFeature.resolve(container).presenter;
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    // Open the layout as the layout editor does: its document, the components, and the default way of
    // creating a dropped element, with the presenter naming Named content and the layout autosaved.
    const openLayout = async () => {
        await presenter.load("site#0001");
        const editor = new Editor<LayoutEditorDocument>(presenter.vm.document!);
        editor.updateEditor(state => {
            state.components = components;
            state.viewport.breakpoints = [{ name: "desktop" } as any];
        });
        editor.registerCommandHandler(Commands.CreateElement, payload => {
            $createElement(editor as unknown as Editor, payload);
        });
        presenter.nameContentAreas(editor);
        container.resolve(LayoutAutoSavePresenter).init(editor);
        return editor;
    };

    // Commands run asynchronously: the element is created once they all finish.
    const dropNamedContent = async (editor: Editor<LayoutEditorDocument>) => {
        await editor.executeCommand(Commands.CreateElement, {
            componentName: LayoutContentArea.NAMED_COMPONENT,
            parentId: "root",
            slot: "children"
        });
        await vi.advanceTimersByTimeAsync(0);
    };

    const setAreaName = (editor: Editor<LayoutEditorDocument>, id: string, name: string) => {
        $updateElementInputs(editor as unknown as Editor, id, inputs => {
            inputs[LayoutContentArea.NAME_INPUT] = name;
        });
    };

    // Open the layout again, as last saved.
    const reload = async () => {
        const saved = updateLayout.execute.mock.calls.at(-1)![1];
        getLayout.execute.mockResolvedValue({
            ...newLayout(),
            elements: saved.elements,
            bindings: saved.bindings
        });
        await presenter.load("site#0001");
        return presenter.vm.document!;
    };

    it("names Named content dropped into a new layout twice area-2 and area-3, on the canvas and in the Navigator", async () => {
        const editor = await openLayout();

        await dropNamedContent(editor);
        await dropNamedContent(editor);

        const document = editor.getDocumentState().read();
        const ids = namedAreaIds(document);
        expect(ids.map(id => areaName(document, id))).toEqual(["area-2", "area-3"]);
        expect(ids.map(id => navigatorLabel(document, id))).toEqual(["area-2", "area-3"]);
    });

    it("saves a renamed Named content area with its new name, and shows it after reloading", async () => {
        const editor = await openLayout();
        await dropNamedContent(editor);
        const [id] = namedAreaIds(editor.getDocumentState().read());

        setAreaName(editor, id, "Sidebar");
        expect(areaName(editor.getDocumentState().read(), id)).toBe("Sidebar");
        await settle();

        const saved = updateLayout.execute.mock.calls.at(-1)![1];
        expect(saved.bindings[id].inputs[LayoutContentArea.NAME_INPUT].static).toBe("Sidebar");

        const reloaded = await reload();
        expect(areaName(reloaded, id)).toBe("Sidebar");
        expect(navigatorLabel(reloaded, id)).toBe("Sidebar");
    });

    it("saves a Named content area whose name is cleared without a name, and shows it as Named content after reloading", async () => {
        const editor = await openLayout();
        await dropNamedContent(editor);
        const [id] = namedAreaIds(editor.getDocumentState().read());

        setAreaName(editor, id, "");
        expect(areaName(editor.getDocumentState().read(), id)).toBeNull();
        await settle();

        const saved = updateLayout.execute.mock.calls.at(-1)![1];
        expect(LayoutContentArea.from(saved, id)!.name()).toBeNull();

        const reloaded = await reload();
        expect(areaName(reloaded, id)).toBeNull();
        expect(navigatorLabel(reloaded, id)).toBe("Named content");
    });
});

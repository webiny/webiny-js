import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Container } from "@webiny/di";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { Editor } from "~/editorSdk/Editor.js";
import { UpdateLayoutUseCase } from "~/features/layouts/index.js";
import { SaveGlobalComponentUseCase } from "~/features/globals/saveGlobalComponent/abstractions.js";
import { ListGlobalComponentsUseCase } from "~/features/globals/listGlobalComponents/abstractions.js";
import type { LayoutEditorDocument } from "../layoutDocument.js";
import { LayoutAutoSavePresenter } from "../AutoSave/abstractions.js";
import { LayoutAutoSavePresenterRegistration } from "../AutoSave/LayoutAutoSavePresenter.js";
import { LayoutGlobalComponentsPresenter } from "./abstractions.js";
import { LayoutGlobalComponentsPresenterRegistration } from "./LayoutGlobalComponentsPresenter.js";

const HEADER = "$global:Demo/Header";
const text = (value: string) => ({ id: value, type: "text", static: value });
const element = (id: string, name: string, parentId?: string) => ({
    type: "Webiny/Element",
    id,
    component: { name },
    ...(parentId ? { parent: { id: parentId, slot: "children" } } : {})
});

// A new English layout with a Site Header placed above its main content.
const createEditor = () => {
    const editor = new Editor<LayoutEditorDocument>({
        id: "site#0001",
        entryId: "site",
        status: "draft",
        locked: false,
        version: 1,
        state: {},
        properties: { id: "site#0001", title: "Site", language: "en", path: "/_webiny/layout" },
        metadata: {},
        extensions: {},
        elements: {
            root: element("root", "Webiny/Root"),
            hdr: element("hdr", "Demo/Header", "root"),
            content: element("content", "Webiny/LayoutContent", "root")
        },
        bindings: {
            root: { inputs: { children: { type: "slot", list: true, static: ["hdr", "content"] } } }
        },
        previewPage: null
    } as unknown as LayoutEditorDocument);

    editor.updateEditor((state: any) => {
        state.components["Demo/Header"] = {
            name: "Demo/Header",
            global: true,
            inputs: [{ name: "title", label: "Title" }]
        };
    });

    return editor;
};

const records: any[] = [
    {
        name: "Demo/Header",
        language: "en",
        elements: { [HEADER]: element(HEADER, "Demo/Header") },
        bindings: { [HEADER]: { inputs: { title: text("ACME Inc") } } }
    }
];

// Records load, and document updates are committed, in microtasks; layout saves wait for the debounce.
const settle = async () => {
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(500);
};

describe("LayoutGlobalComponentsPresenter", () => {
    const updateLayout = { execute: vi.fn() };
    const saveGlobalComponent = { execute: vi.fn() };
    const listGlobalComponents = { execute: vi.fn() };
    const notifications = { success: vi.fn(), warning: vi.fn(), notify: vi.fn() };
    let presenter: LayoutGlobalComponentsPresenter.Interface;
    let editor: Editor<LayoutEditorDocument>;

    const setTitle = (title: string) => {
        editor.updateDocument((document: any) => {
            document.bindings[HEADER].inputs.title = text(title);
        });
    };

    beforeEach(async () => {
        vi.useFakeTimers();
        vi.clearAllMocks();
        updateLayout.execute.mockResolvedValue({});
        saveGlobalComponent.execute.mockImplementation(
            async (params: any) => params.globalComponent
        );
        listGlobalComponents.execute.mockResolvedValue(records);

        const container = new Container();
        container.registerInstance(UpdateLayoutUseCase, updateLayout);
        container.registerInstance(SaveGlobalComponentUseCase, saveGlobalComponent);
        container.registerInstance(ListGlobalComponentsUseCase, listGlobalComponents);
        container.registerInstance(Notifications, notifications as any);
        container.register(LayoutGlobalComponentsPresenterRegistration).inSingletonScope();
        container.register(LayoutAutoSavePresenterRegistration);

        presenter = container.resolve(LayoutGlobalComponentsPresenter);
        editor = createEditor();
        presenter.init(editor);
        container.resolve(LayoutAutoSavePresenter).init(editor);
        await settle();

        editor.updateEditor((state: any) => {
            state.selectedElement = "hdr";
        });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("loads the globals of the layout's language, and doesn't save the layout for showing them", () => {
        expect(listGlobalComponents.execute).toHaveBeenCalledWith({
            language: "en",
            fallback: true
        });
        expect((editor.getDocumentState().read().bindings as any)[HEADER].inputs.title.static).toBe(
            "ACME Inc"
        );
        expect(updateLayout.execute).not.toHaveBeenCalled();
        expect(presenter.vm.target).toMatchObject({
            kind: "global",
            title: "Global component · en",
            hasChanges: false,
            status: "No unsaved changes"
        });
    });

    it("asks whether to save a changed global on this layout only or in the global component", async () => {
        setTitle("New title");
        await settle();

        // A global's changes are saved on demand: the layout isn't autosaved with them.
        expect(updateLayout.execute).not.toHaveBeenCalled();
        expect(presenter.vm.target).toMatchObject({
            hasChanges: true,
            status: "Changes detected",
            defaultSaveTarget: "document",
            saveOptions: [
                { value: "document", label: "Only on this layout", disabled: false },
                {
                    value: "global",
                    label: `Global component (every page in "en")`,
                    disabled: false
                }
            ]
        });
    });

    it("saves a change kept on this layout only as the layout's override", async () => {
        setTitle("Layout title");
        await settle();
        await presenter.save("document");
        await settle();

        expect(saveGlobalComponent.execute).not.toHaveBeenCalled();
        expect(updateLayout.execute).toHaveBeenCalledTimes(1);
        const { elements, bindings } = updateLayout.execute.mock.calls[0][1];
        expect(elements[HEADER]).toBeUndefined();
        expect(bindings[HEADER]).toEqual({ inputs: { title: text("Layout title") } });
        expect(presenter.vm.target).toMatchObject({ hasChanges: false });
    });

    it("saves a change in the global component of the layout's language, not in the layout", async () => {
        setTitle("Global title");
        await settle();
        await presenter.save("global");
        await settle();

        expect(saveGlobalComponent.execute).toHaveBeenCalledTimes(1);
        const { globalComponent } = saveGlobalComponent.execute.mock.calls[0][0];
        expect(globalComponent).toMatchObject({ name: "Demo/Header", language: "en" });
        expect(globalComponent.bindings[HEADER].inputs.title.static).toBe("Global title");
        // The layout is saved without an override of it, so the saved global shows.
        const { bindings } = updateLayout.execute.mock.lastCall![1];
        expect(bindings[HEADER]).toBeUndefined();
        expect(presenter.vm.target).toMatchObject({ hasChanges: false });
    });
});

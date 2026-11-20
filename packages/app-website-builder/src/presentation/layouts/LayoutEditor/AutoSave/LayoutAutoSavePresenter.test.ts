import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Container } from "@webiny/di";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { Editor } from "~/editorSdk/Editor.js";
import { UpdateLayoutUseCase } from "~/features/layouts/index.js";
import type { LayoutEditorDocument } from "../layoutDocument.js";
import { LayoutGlobalComponentsPresenter } from "../GlobalComponents/abstractions.js";
import { LayoutAutoSavePresenter } from "./abstractions.js";
import { LayoutAutoSavePresenterRegistration } from "./LayoutAutoSavePresenter.js";

const createEditor = (options?: { isReadOnly?: boolean }) => {
    return new Editor<LayoutEditorDocument>(
        {
            id: "site#0001",
            entryId: "site",
            status: "draft",
            locked: false,
            version: 1,
            state: {},
            properties: { id: "site#0001", title: "Site", language: null, path: "/_webiny/layout" },
            metadata: {},
            extensions: {},
            elements: {},
            bindings: {},
            previewPage: null
        } as LayoutEditorDocument,
        options
    );
};

// Document state updates are committed in a microtask; saves wait for the debounce.
const settle = async () => {
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(500);
};

describe("LayoutAutoSavePresenter", () => {
    const updateLayout = { execute: vi.fn() };
    const notifications = { success: vi.fn(), warning: vi.fn(), notify: vi.fn() };
    let overridesListener: (() => void) | null;
    let presenter: LayoutAutoSavePresenter.Interface;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
        updateLayout.execute.mockResolvedValue({});
        overridesListener = null;

        const globalComponents = {
            toStoredDocument: (document: any) => document,
            onOverridesChange: (listener: () => void) => {
                overridesListener = listener;
                return () => {
                    overridesListener = null;
                };
            }
        };

        const container = new Container();
        container.registerInstance(UpdateLayoutUseCase, updateLayout);
        container.registerInstance(LayoutGlobalComponentsPresenter, globalComponents as any);
        container.registerInstance(Notifications, notifications as any);
        container.register(LayoutAutoSavePresenterRegistration);
        presenter = container.resolve(LayoutAutoSavePresenter);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("saves the layout's elements and bindings, and the title only once it changes", async () => {
        const editor = createEditor();
        presenter.init(editor);

        editor.updateDocument(state => {
            state.bindings.root = { inputs: {} };
        });
        await settle();

        expect(updateLayout.execute).toHaveBeenCalledTimes(1);
        expect(updateLayout.execute.mock.calls[0][0]).toBe("site#0001");
        expect(updateLayout.execute.mock.calls[0][1]).toEqual({
            elements: {},
            bindings: { root: { inputs: {} } }
        });

        editor.updateDocument(state => {
            state.properties.title = "Renamed";
        });
        await settle();

        expect(updateLayout.execute.mock.calls[1][1].properties).toEqual({ title: "Renamed" });
    });

    it("doesn't save picking a preview page, or a read-only layout", async () => {
        const editor = createEditor();
        presenter.init(editor);

        editor.updateDocument(state => {
            state.previewPage = { id: "home#0001" } as any;
        });
        await settle();
        expect(updateLayout.execute).not.toHaveBeenCalled();

        const readOnly = createEditor({ isReadOnly: true });
        presenter.init(readOnly);
        readOnly.updateDocument(state => {
            state.bindings.root = { inputs: {} };
        });
        await settle();
        expect(updateLayout.execute).not.toHaveBeenCalled();
    });

    it("saves changes made while a save is in flight next, as the latest document", async () => {
        let finish: () => void = () => {};
        updateLayout.execute.mockImplementationOnce(
            () => new Promise<void>(resolve => (finish = resolve))
        );

        const editor = createEditor();
        presenter.init(editor);

        editor.updateDocument(state => {
            state.bindings.a = { inputs: {} };
        });
        await settle();
        expect(editor.getEditorState().read().autoSaving).toBe(true);

        editor.updateDocument(state => {
            state.bindings.b = { inputs: {} };
        });
        await settle();
        expect(updateLayout.execute).toHaveBeenCalledTimes(1);

        finish();
        await vi.advanceTimersByTimeAsync(0);

        expect(updateLayout.execute).toHaveBeenCalledTimes(2);
        expect(Object.keys(updateLayout.execute.mock.calls[1][1].bindings)).toEqual(["a", "b"]);
        expect(editor.getEditorState().read().autoSaving).toBe(false);
    });

    it("saves the layout when its overrides of a global change", async () => {
        presenter.init(createEditor());

        overridesListener?.();
        await settle();

        expect(updateLayout.execute).toHaveBeenCalledTimes(1);
    });

    it("warns when a save fails", async () => {
        updateLayout.execute.mockRejectedValueOnce(new Error("Locked"));
        const editor = createEditor();
        presenter.init(editor);

        editor.updateDocument(state => {
            state.bindings.root = { inputs: {} };
        });
        await settle();

        expect(notifications.warning).toHaveBeenCalledWith({
            title: "Could not save the layout",
            description: "Locked"
        });
    });
});

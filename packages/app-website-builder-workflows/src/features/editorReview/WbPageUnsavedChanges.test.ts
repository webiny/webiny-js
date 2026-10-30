import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { Editor } from "@webiny/app-website-builder/editorSdk/Editor.js";
import type { IPageEditorDocument } from "~/Components/PageEditor/pageEditorDocument.js";
import { WbPageUnsavedChanges } from "./WbPageUnsavedChanges.js";

interface FakeEditorState {
    autoSaving?: boolean;
}

const createUnsavedChanges = (state: FakeEditorState) => {
    const editor = {
        getEditorState: () => ({ read: () => state })
    } as unknown as Editor<IPageEditorDocument>;
    return new WbPageUnsavedChanges(editor);
};

describe("WbPageUnsavedChanges", () => {
    it("blocks Request review while the editor is auto-saving", () => {
        expect(createUnsavedChanges({ autoSaving: true }).getRequestBlockReason()).toBe(
            "Your changes are still saving. Try again in a moment."
        );
    });

    it("does not block once auto-save finished or never ran", () => {
        expect(createUnsavedChanges({ autoSaving: false }).getRequestBlockReason()).toBeNull();
        expect(createUnsavedChanges({}).getRequestBlockReason()).toBeNull();
    });

    it("follows the editor state as it changes", () => {
        const state: FakeEditorState = { autoSaving: true };
        const unsavedChanges = createUnsavedChanges(state);

        state.autoSaving = false;

        expect(unsavedChanges.getRequestBlockReason()).toBeNull();
    });
});

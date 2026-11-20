import debounce from "lodash/debounce.js";
import type { EditorDocument, JsonPatchOperation } from "@webiny/website-builder-sdk";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import type { Editor } from "~/editorSdk/Editor.js";
import { UpdateLayoutUseCase } from "~/features/layouts/index.js";
import { isGlobalOnlyChange } from "~/presentation/globals/overrides/isGlobalOnlyChange.js";
import { LayoutGlobalComponentsPresenter } from "../GlobalComponents/abstractions.js";
import { LayoutAutoSavePresenter as PresenterAbstraction } from "./abstractions.js";

// The page picked to preview the layout with is only shown: picking another isn't a change to save.
const isPreviewOnlyChange = (diff: JsonPatchOperation[]) => {
    return diff.length > 0 && diff.every(operation => operation.path.startsWith("/previewPage"));
};

class LayoutAutoSavePresenterImpl implements PresenterAbstraction.Interface {
    private editor: Editor<EditorDocument> | null = null;
    // One save is in flight at a time, so they're stored in order. Changes made meanwhile are saved
    // next, as the latest document.
    private inFlight = false;
    private queued: EditorDocument | null = null;
    // The title is only saved once the user changes it, so a save never sends a title it didn't edit.
    private savedTitle: unknown = undefined;

    private readonly scheduleSave = debounce(
        (document: EditorDocument) => this.save(document),
        500
    );

    constructor(
        private updateLayout: UpdateLayoutUseCase.Interface,
        private globalComponents: LayoutGlobalComponentsPresenter.Interface,
        private notifications: Notifications.Interface
    ) {}

    init<TDocument extends EditorDocument>(editor: Editor<TDocument>) {
        this.editor = editor as unknown as Editor<EditorDocument>;
        this.queued = null;
        this.savedTitle = editor.getDocumentState().read().properties.title;

        const offChanges = editor.onDocumentStateChange(event => {
            // Global instances are composed into the layout after it opens: that alone isn't a change to save.
            if (
                isPreviewOnlyChange(event.diff) ||
                isGlobalOnlyChange(event.diff, event.state.elements)
            ) {
                return;
            }
            this.scheduleSave(event.state);
        });

        // A global's changes saved for this layout only are layout data: save the layout.
        const offOverrides = this.globalComponents.onOverridesChange(() => {
            this.scheduleSave(editor.getDocumentState().toJson());
        });

        return () => {
            offChanges();
            offOverrides();
            this.scheduleSave.flush();
        };
    }

    private async save(document: EditorDocument) {
        const editor = this.editor;
        if (!editor || editor.getEditorState().read().isReadOnly) {
            return;
        }

        if (this.inFlight) {
            this.queued = document;
            return;
        }

        this.inFlight = true;
        editor.updateEditor(state => {
            state.autoSaving = true;
        });

        try {
            let next: EditorDocument | null = document;
            while (next) {
                await this.saveOnce(next);
                next = this.queued;
                this.queued = null;
            }
        } finally {
            this.inFlight = false;
            editor.updateEditor(state => {
                state.autoSaving = false;
            });
        }
    }

    private async saveOnce(document: EditorDocument) {
        const stored = this.globalComponents.toStoredDocument(document);
        const title = stored.properties.title;
        const titleChanged =
            typeof title === "string" && !!title.trim() && title !== this.savedTitle;
        try {
            await this.updateLayout.execute(document.id, {
                // The editor adds its own properties (e.g., the preview path): only the layout's are saved.
                ...(titleChanged ? { properties: { title } } : {}),
                elements: stored.elements,
                bindings: stored.bindings
            });
            if (titleChanged) {
                this.savedTitle = title;
            }
        } catch (error) {
            this.notifications.warning({
                title: "Could not save the layout",
                description: error.message || "unknown error"
            });
        }
    }
}

export const LayoutAutoSavePresenterRegistration = PresenterAbstraction.createImplementation({
    implementation: LayoutAutoSavePresenterImpl,
    dependencies: [UpdateLayoutUseCase, LayoutGlobalComponentsPresenter, Notifications]
});

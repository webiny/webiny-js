import type { Editor } from "@webiny/app-website-builder/editorSdk/Editor.js";
import type { IReviewUnsavedChanges } from "@webiny/app-workflows/review/content/IReviewUnsavedChanges.js";
import type { IPageEditorDocument } from "~/Components/PageEditor/pageEditorDocument.js";

/*
 * Blocks Request review while the page editor auto-saves: the review would read the stored page,
 * which is not yet what the editor shows. The editor state is observable, so the review bar
 * follows it live and the button turns enabled when the auto-save finishes.
 */
export class WbPageUnsavedChanges implements IReviewUnsavedChanges {
    constructor(private readonly editor: Editor<IPageEditorDocument>) {}

    getRequestBlockReason(): string | null {
        if (this.editor.getEditorState().read().autoSaving === true) {
            return "Your changes are still saving. Try again in a moment.";
        }
        return null;
    }
}

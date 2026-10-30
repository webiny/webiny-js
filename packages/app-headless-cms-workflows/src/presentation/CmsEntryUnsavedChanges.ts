import type { ContentEntryFormPresenter } from "@webiny/app-headless-cms/presentation/contentEntries/form/abstractions.js";
import type { IReviewUnsavedChanges } from "@webiny/app-workflows/review/content/IReviewUnsavedChanges.js";

/*
 * Blocks Request review while the entry form has edits that are not saved: the review would read
 * the stored revision, not what the editor shows. It reads the undecorated form presenter's view
 * model, so the bar follows the form live.
 */
export class CmsEntryUnsavedChanges implements IReviewUnsavedChanges {
    constructor(private readonly form: ContentEntryFormPresenter.Interface) {}

    getRequestBlockReason(): string | null {
        if (this.form.vm.isDirty) {
            return "Save your changes before requesting a review.";
        }
        return null;
    }
}

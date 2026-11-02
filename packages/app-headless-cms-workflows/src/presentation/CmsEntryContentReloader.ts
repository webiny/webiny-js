import type { ContentEntryFormPresenter } from "@webiny/app-headless-cms/presentation/contentEntries/form/abstractions.js";
import type { IReviewContentReloader } from "@webiny/app-workflows/review/content/IReviewContentReloader.js";

/*
 * Reloads the revision a review is tracking after an AI or automation step may have changed it
 * (R262). It works on the undecorated form presenter and never touches the review presenter, so
 * the review bar is not re-initialised. `true` means the reloaded revision differs from the loaded
 * one.
 */
export class CmsEntryContentReloader implements IReviewContentReloader {
    constructor(
        private readonly form: ContentEntryFormPresenter.Interface,
        private readonly revisionId: string
    ) {}

    async reload(): Promise<boolean> {
        const before = this.form.vm.entry;

        // The editor moved to another revision, or has none loaded: there is nothing to reload.
        if (!before || before.id !== this.revisionId) {
            return false;
        }

        // An unsaved edit is never overwritten. While a review locks the form it cannot be dirty.
        if (this.form.vm.isDirty) {
            return false;
        }

        await this.form.loadRevision(this.revisionId);

        const after = this.form.vm.entry;

        if (!after || after.id !== this.revisionId) {
            return false;
        }

        const sameSavedOn = after.revisionSavedOn === before.revisionSavedOn;
        const sameModifiedOn = after.revisionModifiedOn === before.revisionModifiedOn;

        return !sameSavedOn || !sameModifiedOn;
    }
}

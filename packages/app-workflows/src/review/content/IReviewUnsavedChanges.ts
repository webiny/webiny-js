/*
 * Why the editor cannot request a review right now: unsaved edits (CMS form) or an auto-save in
 * flight (WB page editor). Built by the apps and handed to the review presenter through its init
 * parameters. Read inside the presenter's view model, so an observable source keeps the bar live.
 */
export interface IReviewUnsavedChanges {
    // `null` when the stored revision matches what the editor shows.
    getRequestBlockReason(): string | null;
}

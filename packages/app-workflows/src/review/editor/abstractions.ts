import type { TargetReviewPresenter } from "~/review/presentation/targetReview/abstractions.js";

/*
 * One open editor's review state: its presenter. Each app declares its own token for it
 * (`CmsEntryReview`, `WbPageReview`) with `createAbstraction<IEditorReviewSession>` and binds a
 * subclass of `EditorReviewSession` to it (R237). The review use cases are injected by the
 * presenters, never carried here (R353).
 */
export interface IEditorReviewSession {
    readonly presenter: TargetReviewPresenter.Interface;
}

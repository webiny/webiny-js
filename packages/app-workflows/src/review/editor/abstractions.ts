import type { IReviewUseCases } from "~/review/useCases/IReviewUseCases.js";
import type { TargetReviewPresenter } from "~/review/presentation/targetReview/abstractions.js";

/*
 * One open editor's review state: its presenter and its app's use cases. Each app declares its
 * own token for it (`CmsEntryReview`, `WbPageReview`) with `createAbstraction<IEditorReviewSession>`
 * and binds a subclass of `EditorReviewSession` to it.
 */
export interface IEditorReviewSession {
    readonly presenter: TargetReviewPresenter.Interface;
    readonly useCases: IReviewUseCases;
}

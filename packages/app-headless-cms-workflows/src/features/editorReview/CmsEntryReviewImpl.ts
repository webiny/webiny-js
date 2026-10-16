import { EditorReviewSession } from "@webiny/app-workflows/review/editor/EditorReviewSession.js";
import { TargetReviewPresenter } from "@webiny/app-workflows/review/presentation/targetReview/abstractions.js";
import { CmsReviewUseCases } from "~/features/gateway/CmsReviewUseCases.js";
import { CmsEntryReview as Abstraction } from "./CmsEntryReview.js";

/*
 * The shared session class is never registered itself: `createImplementation` stores the
 * abstraction and dependencies on the class, so each app subclasses it once (R237).
 */
class CmsEntryReviewSessionImpl extends EditorReviewSession implements Abstraction.Interface {}

export const CmsEntryReview = Abstraction.createImplementation({
    implementation: CmsEntryReviewSessionImpl,
    dependencies: [TargetReviewPresenter, CmsReviewUseCases]
});

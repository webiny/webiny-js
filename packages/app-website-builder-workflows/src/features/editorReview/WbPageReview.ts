import { EditorReviewSession } from "@webiny/app-workflows/review/editor/EditorReviewSession.js";
import { TargetReviewPresenter } from "@webiny/app-workflows/review/presentation/targetReview/abstractions.js";
import { WbPageReview as Abstraction } from "./abstractions.js";

class WbPageReviewSessionImpl extends EditorReviewSession implements Abstraction.Interface {}

export const WbPageReview = Abstraction.createImplementation({
    implementation: WbPageReviewSessionImpl,
    dependencies: [TargetReviewPresenter]
});

import { AppReviewRowProvider } from "@webiny/app-workflows/review/mounting/AppReviewRowProvider.js";
import { CmsReviewContentAdapter } from "../CmsReviewContentAdapter/abstractions.js";
import { CmsReviewRowProvider as Abstraction } from "./abstractions.js";
import { CmsReviewUseCases } from "../CmsReviewUseCases/abstractions.js";

// A subclass of its own: `createImplementation` stores the abstraction on the class, so the shared
// class must never be bound directly (it would collide with the Website Builder binding).
class CmsReviewRowProviderImpl extends AppReviewRowProvider implements Abstraction.Interface {}

export const CmsReviewRowProvider = Abstraction.createImplementation({
    implementation: CmsReviewRowProviderImpl,
    dependencies: [CmsReviewUseCases, CmsReviewContentAdapter]
});

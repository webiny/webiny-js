import { AppReviewRowProvider } from "@webiny/app-workflows/review/mounting/AppReviewRowProvider.js";
import { WbReviewContentAdapter } from "../WbReviewContentAdapter/abstractions.js";
import { WbReviewRowProvider as Abstraction } from "./abstractions.js";

// A subclass of its own: `createImplementation` stores the abstraction on the class, so the shared
// class must never be bound directly (it would collide with the CMS binding).
class WbReviewRowProviderImpl extends AppReviewRowProvider implements Abstraction.Interface {}

export const WbReviewRowProvider = Abstraction.createImplementation({
    implementation: WbReviewRowProviderImpl,
    dependencies: [WbReviewContentAdapter]
});

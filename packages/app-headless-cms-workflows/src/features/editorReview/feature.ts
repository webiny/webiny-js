import { createFeature } from "@webiny/feature/admin";
import { CmsEntryReview as Abstraction } from "./abstractions.js";
import { CmsEntryReview } from "./CmsEntryReview.js";

export const CmsEntryReviewFeature = createFeature({
    name: "CmsWorkflows/EntryReview",
    register(container) {
        container.register(CmsEntryReview).inSingletonScope();
    },
    resolve(container) {
        return {
            session: container.resolve(Abstraction)
        };
    }
});

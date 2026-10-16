import { createFeature } from "@webiny/feature/admin";
import { WbPageReview as Abstraction } from "./WbPageReview.js";
import { WbPageReview } from "./WbPageReviewSessionImpl.js";

export const WbPageReviewFeature = createFeature({
    name: "WebsiteBuilder/Workflows/PageReviewSession",
    register(container) {
        container.register(WbPageReview).inSingletonScope();
    },
    resolve(container) {
        return {
            session: container.resolve(Abstraction)
        };
    }
});

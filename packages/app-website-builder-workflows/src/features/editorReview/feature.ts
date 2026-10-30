import { createFeature } from "@webiny/feature/admin";
import { WbPageReview as Abstraction } from "./abstractions.js";
import { WbPageReview } from "./WbPageReview.js";

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

import { createFeature } from "@webiny/feature/api";
import { ReviewTeamLoader } from "./ReviewTeamLoader.js";

export const ReviewTeamLoaderFeature = createFeature({
    name: "Workflows/ReviewTeamLoader",
    register(container) {
        // Batches and caches team reads for one request.
        container.register(ReviewTeamLoader).inContainerScope();
    }
});

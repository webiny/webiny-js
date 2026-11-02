import { createFeature } from "@webiny/feature/api";
import { CurrentReviewViewer } from "./CurrentReviewViewer.js";

export const CurrentReviewViewerFeature = createFeature({
    name: "Workflows/CurrentReviewViewer",
    register(container) {
        container.register(CurrentReviewViewer);
    }
});

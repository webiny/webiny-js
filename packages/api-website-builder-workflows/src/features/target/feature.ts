import { createFeature } from "@webiny/feature/api";
import { WbPageReviewNamespace } from "./WbPageReviewNamespace.js";
import { WbPageTargetReader } from "./WbPageTargetReader/WbPageTargetReader.js";
import { WbPageAccess } from "./WbPageAccess/WbPageAccess.js";
import { WbPageReviewTargetLoader } from "./WbPageReviewTargetLoader.js";
import { WbPageReviewTargetSync } from "./WbPageReviewTargetSync.js";
import { WbPageReviewTargetReadAccess } from "./WbPageReviewTargetReadAccess.js";

/** The `wb.page` target adapter (spec 9.3). */
export const WbTargetFeature = createFeature({
    name: "WebsiteBuilderWorkflows/Target",
    register(container) {
        // Lets the single CMS handlers cover pages (R51).
        container.register(WbPageReviewNamespace);
        container.register(WbPageTargetReader);
        container.register(WbPageAccess);

        // Engine ports, one per namespace (R28, R50).
        container.register(WbPageReviewTargetLoader);
        container.register(WbPageReviewTargetSync);
        container.register(WbPageReviewTargetReadAccess);
    }
});

import { createFeature } from "@webiny/feature/api";
import { CmsModelReviewNamespace } from "./CmsEntryReviewNamespace/CmsModelReviewNamespace.js";
import { CmsEntryTargetReader } from "./CmsEntryTargetReader/CmsEntryTargetReader.js";
import { CmsEntryAccess } from "./CmsEntryAccess/CmsEntryAccess.js";
import { CmsEntryFolderExistsService } from "./CmsEntryFolderExistsService/CmsEntryFolderExistsService.js";
import { CmsEntryReviewTargetLoader } from "./CmsEntryReviewTargetLoader.js";
import { CmsEntryReviewTargetSync } from "./CmsEntryReviewTargetSync.js";
import { CmsEntryReviewTargetReadAccess } from "./CmsEntryReviewTargetReadAccess.js";
import { CmsEntryReviewTargetFolderChain } from "./CmsEntryReviewTargetFolderChain.js";

/** The `cms.*` target adapter (spec 9.3). */
export const CmsTargetFeature = createFeature({
    name: "CmsWorkflows/Target",
    register(container) {
        container.register(CmsModelReviewNamespace);
        container.register(CmsEntryTargetReader);
        container.register(CmsEntryAccess);
        container.register(CmsEntryFolderExistsService);

        // Engine ports, one per namespace (R28, R50, R114).
        container.register(CmsEntryReviewTargetLoader);
        container.register(CmsEntryReviewTargetSync);
        container.register(CmsEntryReviewTargetReadAccess);
        container.register(CmsEntryReviewTargetFolderChain);
    }
});

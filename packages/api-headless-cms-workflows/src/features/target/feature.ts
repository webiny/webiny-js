import { createFeature } from "@webiny/feature/api";
import { CmsModelReviewNamespace } from "./CmsEntryReviewNamespace/CmsModelReviewNamespace.js";
import { CmsModelGroupService } from "./CmsModelGroupService/CmsModelGroupService.js";
import { CmsEntryTargetReader } from "./CmsEntryTargetReader/CmsEntryTargetReader.js";
import { CmsEntryAccess } from "./CmsEntryAccess/CmsEntryAccess.js";
import { CmsEntryFolderExistsService } from "./CmsEntryFolderExistsService/CmsEntryFolderExistsService.js";
import { CmsEntryReviewTargetLoader } from "./CmsEntryReviewTargetLoader.js";
import { CmsEntryReviewTargetSync } from "./CmsEntryReviewTargetSync.js";
import { CmsEntryReviewTargetReadAccess } from "./CmsEntryReviewTargetReadAccess.js";
import { CmsEntryReviewTargetFolderChain } from "./CmsEntryReviewTargetFolderChain.js";
import { CmsEntryReviewTargetEditor } from "./CmsEntryReviewTargetEditor.js";
import { CmsEntryReviewTargetLink } from "./CmsEntryReviewTargetLink.js";
import { WorkflowEntrySystemField } from "./WorkflowEntrySystemField.js";

/** The `cms.*` target adapter (spec 9.3). */
export const CmsTargetFeature = createFeature({
    name: "CmsWorkflows/Target",
    register(container) {
        container.register(CmsModelReviewNamespace);
        container.register(CmsModelGroupService);
        container.register(CmsEntryTargetReader);
        container.register(CmsEntryAccess);
        container.register(CmsEntryFolderExistsService);

        // Engine ports, one per namespace (R28, R50, R114).
        container.register(CmsEntryReviewTargetLoader);
        container.register(CmsEntryReviewTargetSync);
        container.register(CmsEntryReviewTargetReadAccess);
        container.register(CmsEntryReviewTargetFolderChain);

        // The AI step's editor port, one per namespace (R172).
        container.register(CmsEntryReviewTargetEditor);

        // Where the notification e-mail links to the content, one per namespace (R195).
        container.register(CmsEntryReviewTargetLink);

        // `system.workflow` as a filterable entry system field (spec 4.5).
        container.register(WorkflowEntrySystemField);
    }
});

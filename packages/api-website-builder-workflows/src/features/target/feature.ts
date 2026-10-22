import { createFeature } from "@webiny/feature/api";
import { WbPageReviewNamespace } from "./WbPageReviewNamespace.js";
import { WbPageTargetReader } from "./WbPageTargetReader/WbPageTargetReader.js";
import { WbPageAccess } from "./WbPageAccess/WbPageAccess.js";
import { WbPageFolderExistsService } from "./WbPageFolderExistsService/WbPageFolderExistsService.js";
import { WbPageDeniedFolders } from "./WbPageDeniedFolders/WbPageDeniedFolders.js";
import { WbPageReviewReadFilter } from "./WbPageReviewReadFilter/WbPageReviewReadFilter.js";
import { WbPageReviewTargetLoader } from "./WbPageReviewTargetLoader.js";
import { WbPageReviewTargetSync } from "./WbPageReviewTargetSync.js";
import { WbPageReviewTargetReadAccess } from "./WbPageReviewTargetReadAccess.js";
import { WbPageReviewTargetFolderChain } from "./WbPageReviewTargetFolderChain.js";
import { WbPageReviewTargetEditor } from "./WbPageReviewTargetEditor.js";
import { WbPageReviewTargetLink } from "./WbPageReviewTargetLink.js";

/** The `wb.page` target adapter (spec 9.3). */
export const WbTargetFeature = createFeature({
    name: "WebsiteBuilderWorkflows/Target",
    register(container) {
        // Lets the single CMS handlers cover pages (R51).
        container.register(WbPageReviewNamespace);
        container.register(WbPageTargetReader);
        container.register(WbPageAccess);
        // The workflow editor's dangling-folder check (D69, R125).
        container.register(WbPageFolderExistsService);
        // Caches folder read rules for one request.
        container.register(WbPageDeniedFolders).inContainerScope();
        // The page review lists' read filter (Q77).
        container.register(WbPageReviewReadFilter);

        // Engine ports, one per namespace (R28, R50, R114).
        container.register(WbPageReviewTargetLoader);
        container.register(WbPageReviewTargetSync);
        container.register(WbPageReviewTargetReadAccess);
        container.register(WbPageReviewTargetFolderChain);

        // The AI step's editor port for pages (R172).
        container.register(WbPageReviewTargetEditor);

        // Where the notification e-mail links to the page (R195).
        container.register(WbPageReviewTargetLink);
    }
});

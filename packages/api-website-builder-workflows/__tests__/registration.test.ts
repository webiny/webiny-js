import { describe, expect, it } from "vitest";
import type { Abstraction } from "@webiny/di";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { PROJECT_PACKAGE_FEATURE_NAME } from "@webiny/wcp/types.js";
import { ReviewTargetLoader } from "@webiny/api-workflows/features/review/ReviewTargetLoader/index.js";
import { ReviewTargetSync } from "@webiny/api-workflows/features/review/ReviewTargetSync/index.js";
import { ReviewTargetReadAccess } from "@webiny/api-workflows/features/review/ReviewTargetReadAccess/index.js";
import { ReviewTargetFolderChain } from "@webiny/api-workflows/features/review/ReviewTargetFolderChain/index.js";
import { ReviewTargetEditor } from "@webiny/api-workflows/features/review/ReviewTargetEditor/index.js";
import { ReviewTargetLink } from "@webiny/api-workflows/features/notifications/ReviewTargetLink/index.js";
import { WbPageFolderExistsService } from "~/features/target/WbPageFolderExistsService/index.js";
import { CmsEntryReviewNamespace } from "@webiny/api-headless-cms-workflows/features/target/CmsEntryReviewNamespace/index.js";
import { PageBeforePublishEventHandler } from "@webiny/api-website-builder/features/pages/PublishPage/index.js";
import { PageBeforeMoveEventHandler } from "@webiny/api-website-builder/features/pages/MovePage/index.js";
import { PageBeforeTrashEventHandler } from "@webiny/api-website-builder/features/pages/TrashPage/index.js";
import {
    PageAfterDeleteEventHandler,
    PageBeforeDeleteEventHandler
} from "@webiny/api-website-builder/features/pages/DeletePage/index.js";
import { PageRevisionAfterDeleteEventHandler } from "@webiny/api-website-builder/features/pages/DeletePageRevision/index.js";
import { PageRevisionBeforeDeleteEventHandler } from "@webiny/api-website-builder/features/pages/DeletePageRevision/index.js";
import { PAGE_MODEL_ID } from "@webiny/api-website-builder/domain/page/page.model.js";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { StoreWebsiteBuilderPageWorkflowUseCase } from "~/features/wrappers/StoreWebsiteBuilderPageWorkflow/index.js";
import { DeleteWebsiteBuilderPageWorkflowUseCase } from "~/features/wrappers/DeleteWebsiteBuilderPageWorkflow/index.js";
import { ListWebsiteBuilderPageWorkflowsUseCase } from "~/features/wrappers/ListWebsiteBuilderPageWorkflows/index.js";
import { GetWebsiteBuilderPageWorkflowUseCase } from "~/features/wrappers/GetWebsiteBuilderPageWorkflow/index.js";
import { RequestWebsiteBuilderPageReviewUseCase } from "~/features/wrappers/RequestWebsiteBuilderPageReview/index.js";
import { GetWebsiteBuilderPageReviewUseCase } from "~/features/wrappers/GetWebsiteBuilderPageReview/index.js";
import { StartWebsiteBuilderPageReviewStepUseCase } from "~/features/wrappers/StartWebsiteBuilderPageReviewStep/index.js";
import { TakeOverWebsiteBuilderPageReviewStepUseCase } from "~/features/wrappers/TakeOverWebsiteBuilderPageReviewStep/index.js";
import { ApproveWebsiteBuilderPageReviewStepUseCase } from "~/features/wrappers/ApproveWebsiteBuilderPageReviewStep/index.js";
import { RejectWebsiteBuilderPageReviewStepUseCase } from "~/features/wrappers/RejectWebsiteBuilderPageReviewStep/index.js";
import { CancelWebsiteBuilderPageReviewUseCase } from "~/features/wrappers/CancelWebsiteBuilderPageReview/index.js";
import { CancelWebsiteBuilderPageReviewsForDeleteUseCase } from "~/features/wrappers/CancelWebsiteBuilderPageReviewsForDelete/index.js";
import { ListWebsiteBuilderPageReviewsUseCase } from "~/features/wrappers/ListWebsiteBuilderPageReviews/index.js";
import { GetWebsiteBuilderPageTargetReviewUseCase } from "~/features/wrappers/GetWebsiteBuilderPageTargetReview/index.js";
import { GetWebsiteBuilderPageReviewStepRunUseCase } from "~/features/wrappers/GetWebsiteBuilderPageReviewStepRun/index.js";
import { ReassignWebsiteBuilderPageReviewStepUseCase } from "~/features/wrappers/ReassignWebsiteBuilderPageReviewStep/index.js";
import { RestartWebsiteBuilderPageReviewStepUseCase } from "~/features/wrappers/RestartWebsiteBuilderPageReviewStep/index.js";
import { ListWebsiteBuilderPageStepCandidatesUseCase } from "~/features/wrappers/ListWebsiteBuilderPageStepCandidates/index.js";
import { ListWebsiteBuilderPageReviewStepCandidatesUseCase } from "~/features/wrappers/ListWebsiteBuilderPageReviewStepCandidates/index.js";
import { InspectWebsiteBuilderPageRoutingUseCase } from "~/features/wrappers/InspectWebsiteBuilderPageRouting/index.js";
import { WebsiteBuilderPageFolderExistsUseCase } from "~/features/wrappers/WebsiteBuilderPageFolderExists/index.js";
import { WbPageReviewGuardService } from "~/features/wrappers/WbPageReviewGuardService/index.js";

const WRAPPERS: Abstraction<unknown>[] = [
    StoreWebsiteBuilderPageWorkflowUseCase,
    DeleteWebsiteBuilderPageWorkflowUseCase,
    ListWebsiteBuilderPageWorkflowsUseCase,
    GetWebsiteBuilderPageWorkflowUseCase,
    RequestWebsiteBuilderPageReviewUseCase,
    GetWebsiteBuilderPageReviewUseCase,
    StartWebsiteBuilderPageReviewStepUseCase,
    TakeOverWebsiteBuilderPageReviewStepUseCase,
    ApproveWebsiteBuilderPageReviewStepUseCase,
    RejectWebsiteBuilderPageReviewStepUseCase,
    CancelWebsiteBuilderPageReviewUseCase,
    CancelWebsiteBuilderPageReviewsForDeleteUseCase,
    ListWebsiteBuilderPageReviewsUseCase,
    GetWebsiteBuilderPageTargetReviewUseCase,
    GetWebsiteBuilderPageReviewStepRunUseCase,
    ReassignWebsiteBuilderPageReviewStepUseCase,
    RestartWebsiteBuilderPageReviewStepUseCase,
    ListWebsiteBuilderPageStepCandidatesUseCase,
    ListWebsiteBuilderPageReviewStepCandidatesUseCase,
    InspectWebsiteBuilderPageRoutingUseCase,
    WebsiteBuilderPageFolderExistsUseCase,
    WbPageReviewGuardService,
    WbPageFolderExistsService
];

describe("WebsiteBuilderWorkflowsFeature registration", () => {
    it("registers one page adapter port of each kind beside the CMS ones, and every wrapper once", async () => {
        const { container } = await createContextHandler().context();

        // One per namespace: `cms.*` from the CMS package, `wb.page` from this one.
        expect(container.resolveAll(ReviewTargetLoader)).toHaveLength(2);
        expect(container.resolveAll(ReviewTargetSync)).toHaveLength(2);
        expect(container.resolveAll(ReviewTargetReadAccess)).toHaveLength(2);
        expect(container.resolveAll(ReviewTargetFolderChain)).toHaveLength(2);
        expect(
            container
                .resolveAll(ReviewTargetFolderChain)
                .filter((item: ReviewTargetFolderChain.Interface) => item.canHandle("wb.page"))
        ).toHaveLength(1);
        // Only the WB editor is asserted here (R172); this sub-phase does not depend on 6.6.
        expect(
            container
                .resolveAll(ReviewTargetEditor)
                .filter((item: ReviewTargetEditor.Interface) => item.canEdit("wb.page"))
        ).toHaveLength(1);
        // One link adapter per namespace too: `cms.*` from the CMS package, `wb.page` from this one.
        expect(container.resolveAll(ReviewTargetLink)).toHaveLength(2);
        expect(
            container
                .resolveAll(ReviewTargetLink)
                .filter((item: ReviewTargetLink.Interface) => item.canLink("wb.page"))
        ).toHaveLength(1);
        expect(container.resolveAll(CmsEntryReviewNamespace)).toHaveLength(2);
        expect(
            container
                .resolveAll(ReviewTargetLoader)
                .filter((item: ReviewTargetLoader.Interface) => item.canLoad("wb.page"))
        ).toHaveLength(1);
        for (const abstraction of WRAPPERS) {
            expect(container.resolveAll(abstraction)).toHaveLength(1);
        }
    });

    it("registers no wrapper, guard, page adapter or page handler without the advancedPublishingWorkflow license", async () => {
        const license = createTestWcpLicense();
        license.package.features[PROJECT_PACKAGE_FEATURE_NAME.APW] = { enabled: false };
        const { container } = await createContextHandler({ testProjectLicense: license }).context();
        const { container: licensed } = await createContextHandler().context();

        for (const abstraction of WRAPPERS) {
            expect(container.resolveAll(abstraction)).toHaveLength(0);
        }
        // The engine's own ports, the page adapter and the page namespace are all gated.
        expect(container.resolveAll(ReviewTargetLoader)).toHaveLength(0);
        expect(container.resolveAll(ReviewTargetSync)).toHaveLength(0);
        expect(container.resolveAll(ReviewTargetReadAccess)).toHaveLength(0);
        expect(container.resolveAll(ReviewTargetFolderChain)).toHaveLength(0);
        expect(container.resolveAll(ReviewTargetEditor)).toHaveLength(0);
        expect(container.resolveAll(ReviewTargetLink)).toHaveLength(0);
        expect(container.resolveAll(CmsEntryReviewNamespace)).toHaveLength(0);
        const pageModel = { modelId: PAGE_MODEL_ID } as CmsModel;
        expect(
            container
                .resolveAll(CmsEntryReviewNamespace)
                .map((item: CmsEntryReviewNamespace.Interface) => item.resolve(pageModel))
                .filter(Boolean)
        ).toEqual([]);
        // This package's page handlers: one each, none left over without the license.
        const handlers: Abstraction<unknown>[] = [
            PageBeforePublishEventHandler,
            PageBeforeMoveEventHandler,
            PageBeforeTrashEventHandler,
            PageBeforeDeleteEventHandler,
            PageAfterDeleteEventHandler,
            PageRevisionBeforeDeleteEventHandler,
            PageRevisionAfterDeleteEventHandler
        ];
        for (const handler of handlers) {
            expect(licensed.resolveAll(handler).length - container.resolveAll(handler).length).toBe(
                1
            );
        }
    });
});

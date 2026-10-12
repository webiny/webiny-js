import { describe, expect, it } from "vitest";
import type { Abstraction } from "@webiny/di";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { PROJECT_PACKAGE_FEATURE_NAME } from "@webiny/wcp/types.js";
import { ReviewTargetLoader } from "@webiny/api-workflows/features/review/ReviewTargetLoader/index.js";
import { ReviewTargetSync } from "@webiny/api-workflows/features/review/ReviewTargetSync/index.js";
import { ReviewTargetReadAccess } from "@webiny/api-workflows/features/review/ReviewTargetReadAccess/index.js";
import { CmsEntryReviewNamespace } from "@webiny/api-headless-cms-workflows/features/target/CmsEntryReviewNamespace/index.js";
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
    WbPageReviewGuardService
];

describe("WebsiteBuilderWorkflowsFeature registration", () => {
    it("registers one page adapter port of each kind beside the CMS ones, and every wrapper once", async () => {
        const { container } = await createContextHandler().context();

        // One per namespace: `cms.*` from the CMS package, `wb.page` from this one.
        expect(container.resolveAll(ReviewTargetLoader)).toHaveLength(2);
        expect(container.resolveAll(ReviewTargetSync)).toHaveLength(2);
        expect(container.resolveAll(ReviewTargetReadAccess)).toHaveLength(2);
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

    it("registers no wrapper and no guard without the advancedPublishingWorkflow license", async () => {
        const license = createTestWcpLicense();
        license.package.features[PROJECT_PACKAGE_FEATURE_NAME.APW] = { enabled: false };
        const { container } = await createContextHandler({ testProjectLicense: license }).context();

        for (const abstraction of WRAPPERS) {
            expect(container.resolveAll(abstraction)).toHaveLength(0);
        }
    });
});

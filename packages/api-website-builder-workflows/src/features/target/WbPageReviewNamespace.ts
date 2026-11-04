import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { PAGE_MODEL_ID } from "@webiny/api-website-builder/domain/page/page.model.js";
import { CmsEntryReviewNamespace } from "@webiny/api-headless-cms-workflows/features/target/CmsEntryReviewNamespace/index.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";

/**
 * Pages are entries of the private CMS model `wbyWbPage` (`wbPage` with legacy models); their
 * review namespace is `wb.page` (R51), never a `cms.*` one. The page model publishes no CMS entry
 * events, so the page rules listen to the Website Builder page events (`WbHooksFeature`).
 */
class WbPageReviewNamespaceImpl implements CmsEntryReviewNamespace.Interface {
    public resolve(model: CmsModel): string | null {
        return model.modelId === PAGE_MODEL_ID ? WB_PAGE_NAMESPACE : null;
    }
}

export const WbPageReviewNamespace = CmsEntryReviewNamespace.createImplementation({
    implementation: WbPageReviewNamespaceImpl,
    dependencies: []
});

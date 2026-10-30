import { ReviewTargetLink } from "@webiny/api-workflows/features/notifications/ReviewTargetLink/index.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";

/**
 * The `wb.page` admin link of a review's content (R195, D133). It mirrors the admin route
 * `WebsiteBuilder/Pages/Editor` in `packages/app-website-builder/src/routes.ts`
 * (`/website-builder/pages/editor/:id`), where `:id` is the page revision id. That file lives in a
 * client package the API cannot import, so a route change there must be mirrored here. The
 * revision id carries a `#`, which `encodeURIComponent` turns into `%23`. The path has no host
 * and no tenant: `ReviewTargetLinkService` adds both.
 */
class WbPageReviewTargetLinkImpl implements ReviewTargetLink.Interface {
    public canLink(model: string): boolean {
        return model === WB_PAGE_NAMESPACE;
    }

    public getPath(params: ReviewTargetLink.Params): string {
        return `/website-builder/pages/editor/${encodeURIComponent(params.targetRevisionId)}`;
    }
}

export const WbPageReviewTargetLink = ReviewTargetLink.createImplementation({
    implementation: WbPageReviewTargetLinkImpl,
    dependencies: []
});

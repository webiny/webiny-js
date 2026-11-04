import { ReviewTargetLink } from "@webiny/api-workflows/features/notifications/ReviewTargetLink/index.js";
import { getModelIdFromAppName, isCmsNamespace } from "~/utils/appName.js";

/**
 * The `cms.<modelId>` admin link of a review's content (R195, D133). It mirrors the admin route
 * `Cms/ContentEntries/List` in `packages/app-headless-cms/src/routes.ts`
 * (`/cms/content-entries/:modelId`); the open entry is its `id` query parameter. That file lives
 * in a client package the API cannot import, so a route change there must be mirrored here. The
 * revision id carries a `#`, which `encodeURIComponent` turns into `%23` so the browser does not
 * read it as a fragment. The path has no host and no tenant: `ReviewTargetLinkService` adds both.
 */
class CmsEntryReviewTargetLinkImpl implements ReviewTargetLink.Interface {
    public canLink(model: string): boolean {
        return isCmsNamespace(model);
    }

    public getPath(params: ReviewTargetLink.Params): string {
        // `canLink` guarantees a `cms.<modelId>` namespace; the fallback only keeps this a string.
        const modelId = getModelIdFromAppName(params.model) ?? params.model;
        return `/cms/content-entries/${encodeURIComponent(modelId)}?id=${encodeURIComponent(params.targetRevisionId)}`;
    }
}

export const CmsEntryReviewTargetLink = ReviewTargetLink.createImplementation({
    implementation: CmsEntryReviewTargetLinkImpl,
    dependencies: []
});

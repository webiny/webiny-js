import { createAbstraction } from "@webiny/feature/api";

export interface ReviewTargetLinkParams {
    /** Namespace id, e.g. "cms.article" or "wb.page" (D41). */
    model: string;
    targetId: string;
    targetRevisionId: string;
}

export interface IReviewTargetLink {
    /** Whether this adapter knows the admin route of the namespace, e.g. "cms.article". */
    canLink(model: string): boolean;
    /**
     * The admin path that opens the revision, starting with `/` and without the host, a tenant
     * or a fragment. The ids are encoded (`encodeURIComponent`). Never reads the target.
     */
    getPath(params: ReviewTargetLinkParams): string;
}

/**
 * Where a review's content is opened in the admin (R195, D133): the engine cannot know the admin
 * routes, so each app registers one adapter per namespace (`cms.*` in api-headless-cms-workflows,
 * `wb.page` in api-website-builder-workflows). The last registered match wins. The engine reaches
 * it only through `ReviewTargetLinkService`.
 */
export const ReviewTargetLink = createAbstraction<IReviewTargetLink>("ReviewTargetLink");

export namespace ReviewTargetLink {
    export type Interface = IReviewTargetLink;
    export type Params = ReviewTargetLinkParams;
}

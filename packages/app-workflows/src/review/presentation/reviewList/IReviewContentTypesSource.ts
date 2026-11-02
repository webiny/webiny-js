import type { ReviewContentTypeOption } from "./IReviewContentTypeFilter.js";

export interface ReviewContentTypesVm {
    // `true` while the app still loads what the list needs (the CMS model list).
    loading: boolean;
    namespaces: string[];
    options: ReviewContentTypeOption[];
}

/*
 * The content types an app's Content Reviews page lists, read live: the page is registered as a
 * route once, so it reads this source instead of props captured at registration.
 */
export interface IReviewContentTypesSource {
    readonly vm: ReviewContentTypesVm;
}

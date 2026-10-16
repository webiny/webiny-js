import type { TargetReviewContext } from "@webiny/app-workflows/review/presentation/targetReview/abstractions.js";
import { WbPageStatus } from "@webiny/app-website-builder/constants.js";
import type { ISelectedPage } from "./pageEditorDocument.js";

export interface IPageReviewEditor {
    getEditorOptions(): { isReadOnly?: boolean };
}

// The review context of the open page: what the review bar needs to know about it. Pure.
export function getPageReviewContext(
    editor: IPageReviewEditor,
    page: ISelectedPage
): TargetReviewContext {
    const options = editor.getEditorOptions();

    return {
        targetTitle: page.title,
        canRequest: options.isReadOnly !== true,
        isPublished: page.status === WbPageStatus.Published,
        isUnpublished: page.status === WbPageStatus.Unpublished
    };
}

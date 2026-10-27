import type { TargetReviewContext } from "@webiny/app-workflows/review/presentation/targetReview/abstractions.js";
import { WbPageStatus } from "@webiny/app-website-builder/constants.js";
import type { ISelectedPage } from "./pageEditorDocument.js";

export interface IPageReviewEditorOptions {
    isReadOnly?: boolean;
}

export interface IPageReviewEditor {
    getEditorOptions(): IPageReviewEditorOptions;
}

/*
 * The review context of the open page: what the review bar needs to know about it. A review can
 * be requested only by a user who can edit the page, on an editable page. Pure.
 */
export function getPageReviewContext(
    editor: IPageReviewEditor,
    page: ISelectedPage,
    canEdit: boolean
): TargetReviewContext {
    const options = editor.getEditorOptions();

    return {
        targetTitle: page.title,
        canRequest: canEdit && options.isReadOnly !== true,
        isPublished: page.status === WbPageStatus.Published,
        isUnpublished: page.status === WbPageStatus.Unpublished
    };
}

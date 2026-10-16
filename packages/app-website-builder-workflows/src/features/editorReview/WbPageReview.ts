import { createAbstraction } from "@webiny/feature/admin";
import type { IEditorReviewSession } from "@webiny/app-workflows/review/editor/abstractions.js";

export const WbPageReview = createAbstraction<IEditorReviewSession>(
    "WebsiteBuilder/Workflows/PageReview"
);

export namespace WbPageReview {
    export type Interface = IEditorReviewSession;
}

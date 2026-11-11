import { createAbstraction } from "@webiny/feature/admin";
import type { IEditorReviewSession } from "@webiny/app-workflows/review/editor/abstractions.js";

export const CmsEntryReview = createAbstraction<IEditorReviewSession>("Cms/Workflows/EntryReview");

export namespace CmsEntryReview {
    export type Interface = IEditorReviewSession;
}

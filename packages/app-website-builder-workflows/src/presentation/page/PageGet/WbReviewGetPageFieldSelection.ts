import { GetPageGraphQLFieldSelection } from "@webiny/app-website-builder/features/pages/getPage/abstractions.js";
import { WB_REVIEW_PAGE_SELECTION } from "../wbReviewPageSelection.js";

class WbReviewGetPageFieldSelectionImpl implements GetPageGraphQLFieldSelection.Interface {
    getSelection(): string[] {
        return [WB_REVIEW_PAGE_SELECTION];
    }
}

export const WbReviewGetPageFieldSelection = GetPageGraphQLFieldSelection.createImplementation({
    dependencies: [],
    implementation: WbReviewGetPageFieldSelectionImpl
});

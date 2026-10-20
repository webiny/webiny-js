import { ListPagesGraphQLFieldSelection } from "@webiny/app-website-builder/features/pages/listPages/abstractions.js";
import { WB_REVIEW_PAGE_SELECTION } from "../wbReviewPageSelection.js";

class WbReviewListPagesFieldSelectionImpl implements ListPagesGraphQLFieldSelection.Interface {
    getSelection(): string[] {
        return [WB_REVIEW_PAGE_SELECTION];
    }
}

export const WbReviewListPagesFieldSelection = ListPagesGraphQLFieldSelection.createImplementation({
    dependencies: [],
    implementation: WbReviewListPagesFieldSelectionImpl
});

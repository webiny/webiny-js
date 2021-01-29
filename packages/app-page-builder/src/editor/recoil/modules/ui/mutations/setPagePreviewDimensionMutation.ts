import { EventActionHandlerMutationActionCallable } from "@webiny/app-page-builder/types";
import { PagePreviewDimension, UiAtomType } from "../uiAtom";

export const setPagePreviewDimensionMutation: EventActionHandlerMutationActionCallable<
    UiAtomType,
    PagePreviewDimension
> = (state, pagePreviewDimension) => {
    return {
        ...state,
        pagePreviewDimension
    };
};

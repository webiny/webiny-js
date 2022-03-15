import { EventActionHandlerMutationActionCallable } from "~/types";
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

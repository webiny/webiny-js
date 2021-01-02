import { MutationActionCallable } from "../../../eventActions";
import { PagePreviewDimension, UiAtomType } from "../uiAtom";

export const setPagePreviewDimensionMutation: MutationActionCallable<
    UiAtomType,
    PagePreviewDimension
> = (state, pagePreviewDimension) => {
    return {
        ...state,
        pagePreviewDimension
    };
};

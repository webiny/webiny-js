import { useFeature } from "@webiny/app";
import { ComponentEditorFeature } from "./feature.js";

export function useComponentEditorPresenter() {
    const { presenter } = useFeature(ComponentEditorFeature);
    return presenter;
}

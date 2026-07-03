import { useFeature } from "@webiny/app";
import { NewContentModelPresenterFeature } from "./feature.js";

export const useNewContentModelPresenter = () => {
    const { presenter } = useFeature(NewContentModelPresenterFeature);
    return presenter;
};

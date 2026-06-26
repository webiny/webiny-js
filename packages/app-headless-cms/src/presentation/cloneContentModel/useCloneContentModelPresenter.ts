import { useFeature } from "@webiny/app";
import { CloneContentModelPresenterFeature } from "./feature.js";

export const useCloneContentModelPresenter = () => {
    const { presenter } = useFeature(CloneContentModelPresenterFeature);
    return presenter;
};

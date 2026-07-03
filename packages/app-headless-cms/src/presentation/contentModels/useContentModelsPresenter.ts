import { useFeature } from "@webiny/app";
import { ContentModelsPresenterFeature } from "./feature.js";

export const useContentModelsPresenter = () => {
    const { presenter } = useFeature(ContentModelsPresenterFeature);
    return presenter;
};

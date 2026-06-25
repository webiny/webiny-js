import { useFeature } from "@webiny/app";
import { ImportContentModelsPresenterFeature } from "./feature.js";

export const useImportContentModelsPresenter = () => {
    const { presenter } = useFeature(ImportContentModelsPresenterFeature);
    return presenter;
};

import { useFeature } from "@webiny/app";
import { CommentsPresenterFeature } from "./feature.js";

export const useCommentsPresenter = () => {
    return useFeature(CommentsPresenterFeature).presenter;
};

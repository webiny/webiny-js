import { useFeature } from "@webiny/app";
import { NotificationsPresenterFeature } from "./feature.js";

export const useNotificationsPresenter = () => {
    return useFeature(NotificationsPresenterFeature).presenter;
};

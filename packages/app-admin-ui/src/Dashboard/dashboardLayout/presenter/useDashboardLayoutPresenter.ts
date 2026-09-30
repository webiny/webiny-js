import { useFeature } from "@webiny/app";
import { DashboardLayoutPresenterFeature } from "./feature.js";

export const useDashboardLayoutPresenter = () => {
    return useFeature(DashboardLayoutPresenterFeature).presenter;
};

import { useFeature } from "@webiny/app";
import { SchedulerListPresenterFeature } from "./feature.js";

export const useSchedulerListPresenter = () => {
    return useFeature(SchedulerListPresenterFeature).presenter;
};

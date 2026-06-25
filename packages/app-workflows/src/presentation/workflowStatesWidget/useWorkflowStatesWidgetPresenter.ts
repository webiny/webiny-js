import { useFeature } from "@webiny/app";
import { WorkflowStatesWidgetPresenterFeature } from "./feature.js";

export const useWorkflowStatesWidgetPresenter = () => {
    return useFeature(WorkflowStatesWidgetPresenterFeature).presenter;
};

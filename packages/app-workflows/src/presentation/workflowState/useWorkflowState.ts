import { useFeature } from "@webiny/app";
import { WorkflowStatePresenterFeature } from "./feature.js";

export const useWorkflowStatePresenter = () => {
    return useFeature(WorkflowStatePresenterFeature).presenter;
};

export const useWorkflowState = () => {
    return { presenter: useWorkflowStatePresenter() };
};

import { useFeature } from "@webiny/app";
import { WorkflowStateListPresenterFeature } from "./feature.js";

export const useWorkflowStateListPresenter = () => {
    return useFeature(WorkflowStateListPresenterFeature).presenter;
};

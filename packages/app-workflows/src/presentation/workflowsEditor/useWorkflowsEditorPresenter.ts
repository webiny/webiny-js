import { useFeature } from "@webiny/app";
import { WorkflowsEditorPresenterFeature } from "./feature.js";

export const useWorkflowsEditorPresenter = () => {
    return useFeature(WorkflowsEditorPresenterFeature).presenter;
};

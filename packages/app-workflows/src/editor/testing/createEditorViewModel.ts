import type { WorkflowEditorPresenter } from "~/editor/presentation/editor/abstractions.js";
import type { WorkflowHeaderVm } from "~/editor/presentation/editor/abstractions.js";

// The header of an open workflow: clean, savable, deletable; a test overrides what it asserts on.
export const createWorkflowHeaderVm = (
    overrides: Partial<WorkflowHeaderVm> = {}
): WorkflowHeaderVm => {
    return {
        name: "Article review",
        nameError: null,
        appliesTo: "Applies to Article · Headless CMS model",
        dirty: false,
        saving: false,
        canSave: true,
        canDelete: true,
        ...overrides
    };
};

// The view model of a ready editor with one model row and no open model.
export const createEditorViewModel = (
    overrides: Partial<WorkflowEditorPresenter.ViewModel> = {}
): WorkflowEditorPresenter.ViewModel => {
    return {
        status: "ready",
        error: null,
        panel: {
            label: "Content models",
            showSearch: true,
            search: "",
            rows: [
                {
                    modelId: "article",
                    name: "Article",
                    subLine: "No workflow",
                    bound: false,
                    unsaved: false,
                    active: false
                }
            ],
            loading: false,
            loadingMore: false,
            hasMore: false,
            emptyText: null,
            error: null
        },
        detail: "none",
        header: null,
        empty: null,
        flow: { steps: [], stepsError: null, modelName: "Article" },
        typePicker: null,
        optionsBanner: null,
        saveBanner: null,
        dialog: null,
        scrollRequest: null,
        openStepId: null,
        ...overrides
    };
};

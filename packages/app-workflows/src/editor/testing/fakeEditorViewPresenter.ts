import { vi } from "vitest";
import type { Mock } from "vitest";
import type { WorkflowEditorPresenter } from "~/editor/presentation/editor/abstractions.js";
import type { WorkflowEditorViewPresenter } from "~/editor/presentation/editor/components/WorkflowEditorViewPresenter.js";
import { createEditorViewModel } from "./createEditorViewModel.js";

export interface FakeEditorViewPresenter extends WorkflowEditorViewPresenter {
    vm: WorkflowEditorPresenter.ViewModel;
    retry: Mock<WorkflowEditorViewPresenter["retry"]>;
    retryModels: Mock<WorkflowEditorViewPresenter["retryModels"]>;
    retryOptions: Mock<WorkflowEditorViewPresenter["retryOptions"]>;
    setSearch: Mock<WorkflowEditorViewPresenter["setSearch"]>;
    loadMore: Mock<WorkflowEditorViewPresenter["loadMore"]>;
    selectModel: Mock<WorkflowEditorViewPresenter["selectModel"]>;
    createWorkflow: Mock<WorkflowEditorViewPresenter["createWorkflow"]>;
    setName: Mock<WorkflowEditorViewPresenter["setName"]>;
    save: Mock<WorkflowEditorViewPresenter["save"]>;
    retrySave: Mock<WorkflowEditorViewPresenter["retrySave"]>;
    dismissBanner: Mock<WorkflowEditorViewPresenter["dismissBanner"]>;
    reloadDuplicate: Mock<WorkflowEditorViewPresenter["reloadDuplicate"]>;
    requestDelete: Mock<WorkflowEditorViewPresenter["requestDelete"]>;
    openTypePicker: Mock<WorkflowEditorViewPresenter["openTypePicker"]>;
    closeTypePicker: Mock<WorkflowEditorViewPresenter["closeTypePicker"]>;
    addStep: Mock<WorkflowEditorViewPresenter["addStep"]>;
    moveStep: Mock<WorkflowEditorViewPresenter["moveStep"]>;
    requestDeleteStep: Mock<WorkflowEditorViewPresenter["requestDeleteStep"]>;
    openStep: Mock<WorkflowEditorViewPresenter["openStep"]>;
    closeStep: Mock<WorkflowEditorViewPresenter["closeStep"]>;
    confirmDialog: Mock<WorkflowEditorViewPresenter["confirmDialog"]>;
    cancelDialog: Mock<WorkflowEditorViewPresenter["cancelDialog"]>;
}

// A narrow presenter that records every command; `addStep` adds nothing (null) unless a test says so.
export const createFakeEditorViewPresenter = (
    vm: WorkflowEditorPresenter.ViewModel = createEditorViewModel()
): FakeEditorViewPresenter => {
    const addStep = vi.fn<WorkflowEditorViewPresenter["addStep"]>();
    addStep.mockReturnValue(null);

    return {
        vm,
        retry: vi.fn(),
        retryModels: vi.fn(),
        retryOptions: vi.fn(),
        setSearch: vi.fn(),
        loadMore: vi.fn(),
        selectModel: vi.fn(),
        createWorkflow: vi.fn(),
        setName: vi.fn(),
        save: vi.fn(),
        retrySave: vi.fn(),
        dismissBanner: vi.fn(),
        reloadDuplicate: vi.fn(),
        requestDelete: vi.fn(),
        openTypePicker: vi.fn(),
        closeTypePicker: vi.fn(),
        addStep,
        moveStep: vi.fn(),
        requestDeleteStep: vi.fn(),
        openStep: vi.fn(),
        closeStep: vi.fn(),
        confirmDialog: vi.fn(),
        cancelDialog: vi.fn()
    };
};

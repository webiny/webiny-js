import { vi } from "vitest";
import type { Mock } from "vitest";
import type { ExclusionDialogPresenter } from "~/settings/presentation/exclusionDialog/abstractions.js";
import type { ExclusionDialogVm } from "~/settings/presentation/exclusionDialog/abstractions.js";
import { createExclusionDialogViewModel } from "./createExclusionDialogViewModel.js";

type DialogPresenter = ExclusionDialogPresenter.Interface;

export interface FakeExclusionDialogPresenter extends DialogPresenter {
    vm: ExclusionDialogVm;
    init: Mock<DialogPresenter["init"]>;
    searchUsers: Mock<DialogPresenter["searchUsers"]>;
    setUser: Mock<DialogPresenter["setUser"]>;
    setReason: Mock<DialogPresenter["setReason"]>;
    setDate: Mock<DialogPresenter["setDate"]>;
    clearDate: Mock<DialogPresenter["clearDate"]>;
    submit: Mock<DialogPresenter["submit"]>;
    removeEntry: Mock<DialogPresenter["removeEntry"]>;
    cancel: Mock<DialogPresenter["cancel"]>;
    dispose: Mock<DialogPresenter["dispose"]>;
}

// An Add / Edit dialog presenter that records every command and renders the given view model.
export const createFakeExclusionDialogPresenter = (
    vm: ExclusionDialogVm = createExclusionDialogViewModel()
): FakeExclusionDialogPresenter => {
    return {
        vm,
        init: vi.fn(),
        searchUsers: vi.fn(),
        setUser: vi.fn(),
        setReason: vi.fn(),
        setDate: vi.fn(),
        clearDate: vi.fn(),
        submit: vi.fn(),
        removeEntry: vi.fn(),
        cancel: vi.fn(),
        dispose: vi.fn()
    };
};

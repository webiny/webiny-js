import { vi } from "vitest";
import type { Mock } from "vitest";
import type { RemoveExclusionDialogPresenter } from "~/settings/presentation/removeDialog/abstractions.js";
import type { RemoveExclusionDialogVm } from "~/settings/presentation/removeDialog/abstractions.js";
import { createRemoveExclusionDialogViewModel } from "./createRemoveExclusionDialogViewModel.js";

type RemovePresenter = RemoveExclusionDialogPresenter.Interface;

export interface FakeRemoveExclusionDialogPresenter extends RemovePresenter {
    vm: RemoveExclusionDialogVm;
    init: Mock<RemovePresenter["init"]>;
    confirm: Mock<RemovePresenter["confirm"]>;
    cancel: Mock<RemovePresenter["cancel"]>;
    dispose: Mock<RemovePresenter["dispose"]>;
}

// A Remove dialog presenter that records every command and renders the given view model.
export const createFakeRemoveExclusionDialogPresenter = (
    vm: RemoveExclusionDialogVm = createRemoveExclusionDialogViewModel()
): FakeRemoveExclusionDialogPresenter => {
    return {
        vm,
        init: vi.fn(),
        confirm: vi.fn(),
        cancel: vi.fn(),
        dispose: vi.fn()
    };
};

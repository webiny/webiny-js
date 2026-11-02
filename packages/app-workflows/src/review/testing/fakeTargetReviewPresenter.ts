import { vi } from "vitest";
import type { Mock } from "vitest";
import type { TargetReviewPresenter } from "~/review/presentation/targetReview/abstractions.js";
import { createTargetReviewViewModel } from "./createTargetReviewViewModel.js";

export interface FakeTargetReviewPresenter extends TargetReviewPresenter.Interface {
    init: Mock<TargetReviewPresenter.Interface["init"]>;
    setContext: Mock<TargetReviewPresenter.Interface["setContext"]>;
    refresh: Mock<TargetReviewPresenter.Interface["refresh"]>;
    actionDone: Mock<TargetReviewPresenter.Interface["actionDone"]>;
    openAction: Mock<TargetReviewPresenter.Interface["openAction"]>;
    closeAction: Mock<TargetReviewPresenter.Interface["closeAction"]>;
    dispose: Mock<TargetReviewPresenter.Interface["dispose"]>;
}

// A presenter that exposes a fixed view model and records every command.
export const createFakePresenter = (
    vm: TargetReviewPresenter.ViewModel = createTargetReviewViewModel()
): FakeTargetReviewPresenter => {
    return {
        vm,
        init: vi.fn().mockResolvedValue(undefined),
        setContext: vi.fn(),
        refresh: vi.fn().mockResolvedValue(undefined),
        actionDone: vi.fn().mockResolvedValue(undefined),
        openAction: vi.fn(),
        closeAction: vi.fn(),
        dispose: vi.fn()
    };
};

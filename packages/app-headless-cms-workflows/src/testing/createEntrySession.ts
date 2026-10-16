import { action } from "mobx";
import { observable } from "mobx";
import type { IEditorReviewSession } from "@webiny/app-workflows/review/editor/abstractions.js";
import type { TargetReviewPresenter } from "@webiny/app-workflows/review/presentation/targetReview/abstractions.js";
import { createFakePresenter } from "@webiny/app-workflows/review/testing/targetReviewFakes.js";
import { createViewModel } from "@webiny/app-workflows/review/testing/targetReviewFakes.js";
import type { FakeTargetReviewPresenter } from "@webiny/app-workflows/review/testing/targetReviewFakes.js";
import { createFakeUseCases } from "@webiny/app-workflows/review/testing/fakeReviewUseCases.js";
import type { FakeReviewUseCases } from "@webiny/app-workflows/review/testing/fakeReviewUseCases.js";

export interface EntrySession {
    session: IEditorReviewSession;
    presenter: FakeTargetReviewPresenter;
    useCases: FakeReviewUseCases;
    setVm(overrides: Partial<TargetReviewPresenter.ViewModel>): void;
}

export function createEntrySession(
    initial: Partial<TargetReviewPresenter.ViewModel> = {}
): EntrySession {
    const state = observable.box(createViewModel(initial), { deep: false });
    const base = createFakePresenter();
    const presenter: FakeTargetReviewPresenter = {
        ...base,
        get vm() {
            return state.get();
        }
    };
    const useCases = createFakeUseCases();
    const session: IEditorReviewSession = { presenter, useCases };
    const setVm = action((overrides: Partial<TargetReviewPresenter.ViewModel>) => {
        state.set(createViewModel(overrides));
    });

    return { session, presenter, useCases, setVm };
}

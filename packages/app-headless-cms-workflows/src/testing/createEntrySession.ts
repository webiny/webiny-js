import { action } from "mobx";
import { observable } from "mobx";
import type { IEditorReviewSession } from "@webiny/app-workflows/review/editor/abstractions.js";
import type { TargetReviewPresenter } from "@webiny/app-workflows/review/presentation/targetReview/abstractions.js";
import { createFakePresenter } from "@webiny/app-workflows/review/testing/fakeTargetReviewPresenter.js";
import { createTargetReviewViewModel } from "@webiny/app-workflows/review/testing/createTargetReviewViewModel.js";
import type { FakeTargetReviewPresenter } from "@webiny/app-workflows/review/testing/fakeTargetReviewPresenter.js";

export interface EntrySession {
    session: IEditorReviewSession;
    presenter: FakeTargetReviewPresenter;
    setVm(overrides: Partial<TargetReviewPresenter.ViewModel>): void;
}

// A session over a fake presenter whose view model a test sets (R355: no use cases travel in it).
export function createEntrySession(
    initial: Partial<TargetReviewPresenter.ViewModel> = {}
): EntrySession {
    const state = observable.box(createTargetReviewViewModel(initial), { deep: false });
    const base = createFakePresenter();
    const presenter: FakeTargetReviewPresenter = {
        ...base,
        get vm() {
            return state.get();
        }
    };
    const session: IEditorReviewSession = { presenter };
    const setVm = action((overrides: Partial<TargetReviewPresenter.ViewModel>) => {
        state.set(createTargetReviewViewModel(overrides));
    });

    return { session, presenter, setVm };
}

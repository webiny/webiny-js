import { action } from "mobx";
import { observable } from "mobx";
import { createFakePresenter } from "@webiny/app-workflows/review/testing/targetReviewFakes.js";
import type { FakeTargetReviewPresenter } from "@webiny/app-workflows/review/testing/targetReviewFakes.js";
import { createFakeUseCases } from "@webiny/app-workflows/review/testing/fakeReviewUseCases.js";
import type { FakeReviewUseCases } from "@webiny/app-workflows/review/testing/fakeReviewUseCases.js";
import type { WbPageReview } from "~/features/editorReview/abstractions.js";
import type { FakeReviewKind } from "./createFakeVm.js";
import { createFakeVm } from "./createFakeVm.js";

export interface FakeSessionHandle {
    session: WbPageReview.Interface;
    presenter: FakeTargetReviewPresenter;
    useCases: FakeReviewUseCases;
    setKind(kind: FakeReviewKind): void;
}

export const createFakeSession = (
    initialKind: FakeReviewKind = "none",
    isUnpublished: boolean = false
): FakeSessionHandle => {
    const state = observable.box(createFakeVm(initialKind, isUnpublished), { deep: false });
    const base = createFakePresenter();
    const presenter: FakeTargetReviewPresenter = {
        ...base,
        get vm() {
            return state.get();
        }
    };
    const useCases = createFakeUseCases();
    const session: WbPageReview.Interface = { presenter, useCases };

    const setKind = action((kind: FakeReviewKind): void => {
        state.set(createFakeVm(kind, isUnpublished));
    });

    return { session, presenter, useCases, setKind };
};

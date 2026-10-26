import { action } from "mobx";
import { observable } from "mobx";
import { createFakePresenter } from "@webiny/app-workflows/review/testing/fakeTargetReviewPresenter.js";
import type { FakeTargetReviewPresenter } from "@webiny/app-workflows/review/testing/fakeTargetReviewPresenter.js";
import type { WbPageReview } from "~/features/editorReview/abstractions.js";
import type { FakeReviewKind } from "./createFakeVm.js";
import { createFakeVm } from "./createFakeVm.js";

export interface FakeSessionHandle {
    session: WbPageReview.Interface;
    presenter: FakeTargetReviewPresenter;
    setKind(kind: FakeReviewKind): void;
}

// A session over a fake presenter whose view model follows the given kind (R355: no use cases travel in it).
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
    const session: WbPageReview.Interface = { presenter };

    const setKind = action((kind: FakeReviewKind): void => {
        state.set(createFakeVm(kind, isUnpublished));
    });

    return { session, presenter, setKind };
};

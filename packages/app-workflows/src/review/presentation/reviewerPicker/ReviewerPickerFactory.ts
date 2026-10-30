import { createAbstraction } from "@webiny/feature/admin";
import type { ReviewerPickerPresenter } from "./abstractions.js";

export interface IReviewerPickerFactory {
    create(): ReviewerPickerPresenter.Interface;
}

/*
 * Creates a new picker presenter per call, for a presenter that owns several pickers (Task 17's
 * request dialog has one per step). A constructor dependency is one instance, so a factory is
 * the way to get many without the presenter touching the container.
 */
export const ReviewerPickerFactory = createAbstraction<IReviewerPickerFactory>(
    "Workflows/ReviewerPickerFactory"
);

export namespace ReviewerPickerFactory {
    export type Interface = IReviewerPickerFactory;
}
